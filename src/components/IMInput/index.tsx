import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import Taro from "@tarojs/taro";
import { Textarea, Text, View, Image } from "@tarojs/components";
import tim from "@/utils/tim";
import IMEmoji from "../IMEmoji";
import { pictures } from "../util";
import "./index.scss";

type Props = {
  conversation: {
    conversationID?: string;
    type?: "C2C" | "GROUP";
  };
  sendMessage: (event: any) => void;
  showMessageErrorImage: ({ showErrorImageFlag: number, message: any }) => void;
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

export default forwardRef<IMInputRef, Props>(
  ({ conversation, sendMessage, showMessageErrorImage }, ref) => {
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

    useImperativeHandle(ref, () => ({
      onInputValueChange,
      handleClose: () => {
        setData((pre) => ({ ...pre, displayFlag: "" }));
      },
    }));

    const recorderManager = Taro.getRecorderManager();

    const switchAudio = () => {
      setData((pre) => ({
        ...pre,
        isAudio: !pre.isAudio,
        text: "按住说话",
      }));
    };

    const onInputValueChange = (event) => {
      if (event.detail.message) {
        setData((pre) => ({
          ...pre,
          message: event.detail.message.payload.text,
          sendMessageBtn: true,
        }));
      } else if (event.detail.value) {
        setData((pre) => ({
          ...pre,
          message: event.detail.value,
          sendMessageBtn: true,
        }));
      } else {
        setData((pre) => ({
          ...pre,
          sendMessageBtn: false,
        }));
      }
    };

    const toAccount = useMemo(() => {
      if (!conversation || !conversation.conversationID) {
        return "";
      }
      switch (conversation.type) {
        case "C2C":
          return conversation.conversationID.replace("C2C", "");
        case "GROUP":
          return conversation.conversationID.replace("GROUP", "");
        default:
          return conversation.conversationID;
      }
    }, [conversation]);

    const $sendTIMMessage = (message) => {
      sendMessage(message);
      tim
        .sendMessage(message, {
          offlinePushInfo: {
            disablePush: true,
          },
        })
        .then(() => {
          // 日志上报
          console.log("发送成功");
        })
        .catch((error) => {
          console.log(error);
          // 日志上报
          showMessageErrorImage({
            showErrorImageFlag: error.code,
            message,
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
      $sendTIMMessage(message);
    };

    useLayoutEffect(() => {
      recorderManager.onStop((res) => {
        Taro.hideLoading();
        if (data.canSend) {
          if (res.duration < 1000) {
            Taro.showToast({
              title: "录音时间太短",
              icon: "none",
            });
          } else {
            // res.tempFilePath 存储录音文件的临时路径
            const message = tim.createAudioMessage({
              to: toAccount,
              conversationType: conversation.type,
              payload: {
                file: res,
              },
            });
            $sendTIMMessage(message);
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
    }, [toAccount, conversation, data]);

    // 长按录音
    const handleLongPress = (e) => {
      recorderManager.start({
        duration: 60000, // 录音的时长，单位 ms，最大值 600000（10 分钟）
        sampleRate: 44100, // 采样率
        numberOfChannels: 1, // 录音通道数
        encodeBitRate: 192000, // 编码码率
        format: "aac", // 音频格式，选择此格式创建的音频消息，可以在即时通信 IM 全平台（Android、iOS、微信小程序和Web）互通
      });
      setData((pre) => ({
        ...pre,
        startPoint: e.touches[0],
        title: "正在录音",
        // isRecording : true,
        // canSend: true,
        notShow: true,
        isShow: false,
        isRecording: true,
        popupToggle: true,
      }));
    };

    // 录音时的手势上划移动距离对应文案变化
    const handleTouchMove = (e) => {
      const diff =
        data.startPoint.clientY - e.touches[e.touches.length - 1].clientY;
      if (data.isRecording) {
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
      setData((pre) => ({
        ...pre,
        isRecording: false,
        popupToggle: false,
      }));
      Taro.hideLoading();
      recorderManager.stop();
    };
    // 选中表情消息
    const handleEmoji = () => {
      let targetFlag = "emoji";
      if (data.displayFlag === "emoji") {
        targetFlag = "";
      }
      setData((pre) => ({
        ...pre,
        displayFlag: targetFlag,
      }));
    };
    // 选自定义消息
    const handleExtensions = () => {
      let targetFlag = "extension";
      if (data.displayFlag === "extension") {
        targetFlag = "";
      }
      setData((pre) => ({
        ...pre,
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

    const sendImageMessage = (type: "camera" | "album") => {
      const maxSize = 20480000;
      Taro.chooseImage({
        sourceType: [type],
        count: 1,
        success: (res) => {
          if (res.tempFiles[0].size > maxSize) {
            Taro.showToast({
              title: "大于20M图片不支持发送",
              icon: "none",
            });
            return;
          }
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
          $sendTIMMessage(message);
        },
      });
    };

    const sendVideoMessage = (type: "camera" | "album") => {
      Taro.chooseVideo({
        sourceType: [type], // 来源相册或者拍摄
        maxDuration: 60, // 设置最长时间60s
        camera: "back", // 后置摄像头
        success: (res) => {
          if (res) {
            const message = tim.createVideoMessage({
              to: toAccount,
              conversationType: conversation.type,
              payload: {
                file: res,
              },
              onProgress: (percent) => {
                message.percent = percent;
              },
            });
            $sendTIMMessage(message);
          }
        },
      });
    };

    const handleSendImage = () => {
      sendImageMessage("album");
    };

    const handleSendPicture = () => {
      sendImageMessage("camera");
    };

    const handleSendVideo = () => {
      sendVideoMessage("album");
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
          $sendTIMMessage(message);
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
                  cursorSpacing={20}
                  value={data.message}
                  onInput={onInputValueChange}
                  maxlength={140}
                  autoHeight
                  placeholderClass="input-placeholder"
                  onConfirm={() => sendTextMessage()}
                />
              </View>
            ) : (
              <View
                className="im-message-input-main im-message-input-main-text"
                onLongPress={handleLongPress}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Text>{data.text}</Text>
              </View>
            )}

            <View className="im-message-input-functions" hover-className="none">
              <Image
                className="im-icon"
                onClick={handleEmoji}
                src={pictures.faceEmoji}
              />
              {!data.sendMessageBtn ? (
                <View onClick={handleExtensions}>
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
              <View className="im-extension-slot" onClick={handleSendPicture}>
                <Image className="im-extension-icon" src={pictures.takePhoto} />
                <View className="im-extension-slot-name">拍摄照片</View>
              </View>

              <View className="im-extension-slot" onClick={handleSendImage}>
                <Image className="im-extension-icon" src={pictures.sendImg} />
                <View className="im-extension-slot-name">发送图片</View>
              </View>

              <View className="im-extension-slot" onClick={handleSendVideo}>
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
            onLongPress={handleLongPress}
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
