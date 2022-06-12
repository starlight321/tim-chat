import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Taro, { AuthSetting, useDidShow } from "@tarojs/taro";
import { Textarea, Text, View, Image } from "@tarojs/components";
import eventEmitter from "@/utils/eventEmitter";
import tim from "@/utils/tim";
import { Conversation } from "@/services";
import { isAndroid } from "@/utils";
import IMEmoji from "../IMEmoji";
import { ChooseImage, ChooseMedia, pictures } from "../util";
import "./index.scss";

type Props = {
  conversation: Conversation;
  toAccount: string;
  updateMsgListHandle: (event: any) => void;
  handleJumpBottom: () => void;
};

type IMInputState = {
  isAudio: boolean;
  text: string;
  message: string;
  sendMessageBtn: boolean;
  canSend: boolean;
  popupToggle: boolean;
  isRecording: boolean;
  bottomVal: number;
  startPoint: any;
  displayFlag: string;
  title: string;
};

export type IMInputRef = {
  onInputValueChange(e): void;
  handleClose(): void;
};

let audioFlag: "start" | "end" | "onStart" | "onStop" | "onError" = "start";
const androidPlatform = isAndroid();
const recorderManager = Taro.getRecorderManager();
export default forwardRef<IMInputRef, Props>(
  ({ toAccount, conversation, updateMsgListHandle, handleJumpBottom }, ref) => {
    const [data, setData] = useState<IMInputState>({
      isAudio: false,
      text: "按住说话",
      message: "",
      sendMessageBtn: false,
      canSend: true,
      popupToggle: false,
      isRecording: false,
      bottomVal: 0,
      startPoint: 0,
      displayFlag: "",
      title: "",
    });
    const dataRef = useRef<{
      toAccount: string;
      conversationType?: "C2C" | "GROUP" | "@TIM#SYSTEM";
      canSend: boolean;
    }>();
    const [authSetting, setAuthSettings] = useState<AuthSetting>({});

    useImperativeHandle(ref, () => ({
      onInputValueChange,
      handleClose: () => {
        setData((pre) => ({ ...pre, displayFlag: "" }));
      },
    }));

    const getSetting = async () => {
      const res = await Taro.getSetting();
      setAuthSettings(res.authSetting);
    };

    useDidShow(() => {
      getSetting();
    });

    useEffect(() => {
      recorderManager.onStart(() => {
        console.log("开始录音", audioFlag);
        if (audioFlag === "end") recorderManager.stop();
        audioFlag = "onStart";
      });

      recorderManager.onStop((res) => {
        if (audioFlag === "start") return;
        console.log("onStop", audioFlag);
        audioFlag = "onStop";
        if (dataRef.current?.canSend) {
          if (res.duration < 1000) {
            Taro.showToast({
              title: "录音时间太短",
              icon: "none",
            });
          } else {
            // res.tempFilePath 存储录音文件的临时路径
            const message = tim.createAudioMessage({
              to: dataRef.current.toAccount,
              conversationType: dataRef.current.conversationType,
              payload: {
                file: res,
              },
            });
            sendTIMMessage(message);
          }
        }
        setData((pre) => ({
          ...pre,
          startPoint: 0,
          popupToggle: false,
          isRecording: false,
          canSend: true,
          title: "",
          text: "按住说话",
        }));
      });

      recorderManager.onError((err) => {
        console.log("录音错误", audioFlag, err);
        audioFlag = "onError";
        // recorderManager.stop();
      });
    }, []);

    const switchAudio = () => {
      setData((pre) => ({
        ...pre,
        isAudio: !pre.isAudio,
        text: "按住说话",
        displayFlag: "",
      }));
    };

    const onInputValueChange = (event) => {
      if (event.detail.message) {
        setData((pre) => ({
          ...pre,
          message: event.detail.message.payload.text,
          sendMessageBtn: true,
        }));
      } else {
        setData((pre) => ({
          ...pre,
          message: event.detail.value,
          sendMessageBtn: event.detail.value ? true : false,
        }));
      }
    };

    const sendTIMMessage = (message) => {
      updateMsgListHandle(message);
      tim
        .sendMessage(message, {
          offlinePushInfo: {
            disablePush: true,
          },
        })
        .then(() => {
          // 日志上报
          console.log("发送成功");
          eventEmitter.emit("im_update_msg_status", {
            message,
            status: "success",
          });
        })
        .catch((error) => {
          console.log("发送失败", error);
          // 日志上报
          Taro.showToast({
            title: error.message,
            duration: 800,
            icon: "none",
          });
          eventEmitter.emit("im_update_msg_status", {
            message,
            status: "fail",
          });
        });
      setData((pre) => ({ ...pre, displayFlag: "" }));
    };

    const sendTextMessage = (msg?: string, flag?: boolean) => {
      const text = flag ? msg : data.message;
      const message = tim.createTextMessage({
        to: toAccount,
        conversationType: conversation.type,
        payload: {
          text,
        },
      });

      setData((pre) => ({
        ...pre,
        message: "",
        sendMessageBtn: false,
      }));
      sendTIMMessage(message);
    };

    useEffect(() => {
      dataRef.current = {
        toAccount,
        conversationType: conversation.type,
        canSend: data.canSend,
      };
    }, [toAccount, conversation.type, data.canSend]);

    const startRecorder = (e) => {
      Taro.hideToast();
      recorderManager.start({
        duration: androidPlatform ? 6000 : 5000, // 录音的时长，单位 ms，最大值 600000（10 分钟）
        sampleRate: 44100, // 采样率
        numberOfChannels: 1, // 录音通道数
        encodeBitRate: 192000, // 编码码率
        format: "aac", // 音频格式，选择此格式创建的音频消息，可以在即时通信 IM 全平台（Android、iOS、微信小程序和Web）互通
      });
      setData((pre) => ({
        ...pre,
        startPoint: e.touches[0],
        title: "正在录音",
        isRecording: true,
        popupToggle: true,
      }));
    };

    // 长按录音
    const handleLongPress = (e) => {
      console.log("handleLongPress", audioFlag);
      audioFlag = "start";
      eventEmitter.emit("im_update_audio_msg", {
        isPlaying: false,
      });
      if (authSetting["scope.record"]) {
        startRecorder(e);
      } else {
        Taro.authorize({
          scope: "scope.record",
          success: () => {
            setAuthSettings((pre) => ({ ...pre, ["scope.record"]: true }));
          },
          fail: () => {
            Taro.showModal({
              title: "请求授权录音",
              content: "需要获取您的录音权限，将拉起授权页",
              success: async (res) => {
                if (res.confirm) {
                  Taro.openSetting({});
                }
              },
            });
          },
        });
      }
    };

    // 录音时的手势上划移动距离对应文案变化
    const handleTouchMove = (e) => {
      // console.log("handleTouchMove");
      if (data.isRecording) {
        const diff =
          data.startPoint.clientY - e.touches[e.touches.length - 1].clientY;
        if (diff > 100) {
          setData((pre) => ({
            ...pre,
            text: "抬起停止",
            title: "松开手指，取消发送",
            canSend: false,
          }));
        } else if (diff > 20) {
          setData((pre) => ({
            ...pre,
            text: "抬起停止",
            title: "上划可取消",
            canSend: true,
          }));
        } else {
          setData((pre) => ({
            ...pre,
            text: "抬起停止",
            title: "正在录音",
            canSend: true,
          }));
        }
      }
    };
    // 手指离开页面滑动
    const handleTouchEnd = () => {
      console.log("handleTouchEnd", audioFlag);
      if (audioFlag === "onStart") {
        console.log("执行stop");
        recorderManager.stop();
      }
      audioFlag = "end";
    };
    // 选自定义消息
    const handleExtensions = (targetType: "emoji" | "extension") => {
      const targetFlag = data.displayFlag !== targetType ? targetType : "";
      setData((pre) => ({
        ...pre,
        isAudio: false,
        text: "",
        displayFlag: targetFlag,
      }));
    };

    const appendMessage = (message: string) => {
      setData((pre) => ({
        ...pre,
        message: pre.message + message,
        sendMessageBtn: true,
      }));
    };

    const handleChooseMedia = (
      mediaType: ("image" | "video")[],
      sourceType: ("album" | "camera")[]
    ) => {
      Taro.chooseMedia({
        count: 1,
        mediaType,
        sourceType,
        maxDuration: 30,
        camera: "back",
        success: (res) => {
          let file: ChooseImage | ChooseMedia = res.tempFiles[0];
          if (res.type === "image") {
            const maxSize = 20480000;
            if (res.tempFiles[0].size > maxSize) {
              Taro.showToast({
                title: "大于20M图片不支持发送",
                icon: "none",
              });
              return;
            }
            file = {
              tempFiles: [
                {
                  size: res.tempFiles[0].size,
                  path: res.tempFiles[0].tempFilePath,
                },
              ],
              tempFilePaths: [file.tempFilePath],
            };
          }
          sendMediaMsg(res.type === "image" ? "Image" : "Video", file);
        },
      });
    };

    useEffect(() => {
      if (data.displayFlag) {
        Taro.nextTick(handleJumpBottom);
      }
    }, [data.displayFlag]);

    const sendImageMessage = (type: "camera" | "album") => {
      const maxSize = 20480000;
      Taro.chooseImage({
        sourceType: [type],
        count: 1,
        success: (res) => {
          console.log(res);

          const message = tim.createImageMessage({
            to: toAccount,
            conversationType: conversation.type,
            payload: {
              file: res,
            },
            onProgress: (percent) => {
              message.percent = percent;
            },
          });
          sendTIMMessage(message);
        },
      });
    };

    const sendMediaMsg = (
      type: "Image" | "Video",
      file: ChooseImage | ChooseMedia
    ) => {
      console.log(type, file);

      const message = tim[`create${type}Message`]({
        to: toAccount,
        conversationType: conversation.type,
        payload: { file: file },
        onProgress: (percent) => {
          message.percent = percent;
        },
      });
      sendTIMMessage(message);
    };

    const handleAlbum = () => {
      // sendImageMessage("camera");
      handleChooseMedia(["image", "video"], ["album"]);
    };
    const handleCamera = () => {
      // sendVideoMessage("album");
      handleChooseMedia(["image"], ["camera"]);
    };

    const handleSendLocation = () => {
      Taro.chooseLocation({
        success: function (res) {
          const message = tim.createLocationMessage({
            to: toAccount,
            conversationType: conversation.type,
            payload: {
              description: JSON.stringify({
                name: res.name,
                address: res.address,
              }),
              longitude: res.longitude, // 经度
              latitude: res.latitude, // 纬度
            },
          });
          sendTIMMessage(message);
        },
        fail: function (err) {
          console.log(err);
        },
      });
    };

    return (
      <>
        <View className="im-message-input-container">
          <View className="im-message-input">
            <Image
              className="im-icon"
              onClick={switchAudio}
              src={pictures[data.isAudio ? "keyboard" : "audio"]}
            />
            {!data.isAudio ? (
              <View className="im-message-input-main">
                <Textarea
                  className="im-message-input-area"
                  adjustPosition
                  showConfirmBar={false}
                  cursorSpacing={20}
                  value={data.message}
                  onInput={onInputValueChange}
                  maxlength={140}
                  autoHeight
                  placeholderClass="input-placeholder"
                  onConfirm={() => sendTextMessage()}
                  onFocus={handleJumpBottom}
                />
              </View>
            ) : (
              <View
                className="im-message-input-main im-message-input-main-text"
                onTouchStart={handleLongPress}
                // onLongPress={handleLongPress}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Text>{data.text}</Text>
              </View>
            )}

            <View className="im-message-input-functions" hover-className="none">
              <Image
                className="im-icon"
                onClick={() => handleExtensions("emoji")}
                src={pictures.faceEmoji}
              />
              {!data.sendMessageBtn ? (
                <View onClick={() => handleExtensions("extension")}>
                  <Image className="im-icon" src={pictures.more} />
                </View>
              ) : (
                <View
                  className="im-sendMessage-btn"
                  onClick={() => sendTextMessage()}
                >
                  发送
                </View>
              )}
            </View>
          </View>
          {data.displayFlag === "emoji" && (
            <View className="im-emoji-area">
              <IMEmoji onChange={appendMessage} />
            </View>
          )}

          {data.displayFlag === "extension" && (
            <View className="im-extensions">
              <View className="im-extension-slot" onClick={handleCamera}>
                <Image className="im-extension-icon" src={pictures.takePhoto} />
                <View className="im-extension-slot-name">拍摄照片</View>
              </View>

              <View
                className="im-extension-slot"
                onClick={() => sendImageMessage("album")}
              >
                <Image className="im-extension-icon" src={pictures.sendImg} />
                <View className="im-extension-slot-name">发送图片</View>
              </View>

              <View className="im-extension-slot" onClick={handleAlbum}>
                <Image className="im-extension-icon" src={pictures.sendVideo} />
                <View className="im-extension-slot-name">发送视频</View>
              </View>

              <View className="im-extension-slot" onClick={handleSendLocation}>
                <Image className="im-extension-icon" src={pictures.location} />
                <View className="im-extension-slot-name">发送位置</View>
              </View>
            </View>
          )}
        </View>

        {data.popupToggle && (
          <View
            className="record-modal"
            onTouchStart={handleLongPress}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <View className="wrapper">
              <View className="modal-loading"></View>
            </View>
            <View className="modal-title">{data.title}</View>
          </View>
        )}
      </>
    );
  }
);
