import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  ITouchEvent,
  CommonEvent,
} from "@tarojs/components";
import Taro from "@tarojs/taro";
import dayjs from "dayjs";
import tim from "@/utils/tim";
import { pictures, ImErrorCode } from "./../util";
import "./index.scss";
import TipMsg from "../TipMsg";
import TextMsg from "../TextMsg";
import ImageMsg from "../ImageMsg";
import AudioMsg from "../AudioMsg";
import VideoMsg from "../VideoMsg";
import FaceMsg from "../FaceMsg";
import CustomMsg from "../CustomMsg";
import SystemMsg from "../SystemMsg";
import PlayVideo, { ImCurrentVideoProps } from "../PlayVideo";
import { parseSystemMsg } from "@/utils/message-facade";

type ConversationType = {
  conversationID?: string;
  type?: "C2C" | "GROUP" | "@TIM#SYSTEM";
};

type Props = {
  conversation: ConversationType;
  inputSentMsg?: (event) => void;
  unreadCount: number;
};

type IMMsgListState = {
  avatar: string;
  userID: string;
  isCompleted: boolean; // 当前会话消息是否已经请求完毕
  messageList: Array<any>; // 消息列表
  showMessageTime: boolean; // 是否展示消息时间
  showMessageHistoryTime: boolean; // 是否展示历史消息时间
  messageTime: string;
  messageHistoryTime: string; // 是否展示消息时间
  newArr: { [key: string]: string };
  messageID: string;
  errorMessage: any;
  errorMessageID: string;
  showMessageError: boolean;
  jumpAim: string;
  triggered: boolean;
  isRevoke: boolean;
  RevokeID: string; // 撤回消息的ID用于处理对方消息展示界面
  showName: string;
  isRewrite: boolean;
  nextReqMessageID: string; // 下一条消息标志
  selectedMessage: any;
  deleteMessage: string;
  resendMessage: any;
  showDownJump: boolean;
  showNewMessageCount: any[];
  isLostsOfUnread: boolean;
  showUpJump: boolean;
};

export type IMMsgListRef = {
  sendMessageError(e): void;
  updateMessageList(e): void;
};

export default forwardRef<IMMsgListRef, Props>(
  ({ conversation, unreadCount }, ref) => {
    const [msgOperateVisible, setMsgOperateVisible] = useState(false);
    const dataRef = useRef<IMMsgListState & ConversationType>();
    const videoContextRef = useRef<any>(null);
    const [currentVideo, setCurrentVideo] = useState<ImCurrentVideoProps>({});

    useImperativeHandle(ref, () => ({
      sendMessageError,
      updateMessageList,
    }));

    const [data, setData] = useState<IMMsgListState>({
      avatar: "",
      userID: "",
      isCompleted: false,
      messageList: [],
      showMessageTime: false,
      showMessageHistoryTime: false,
      messageTime: "",
      messageHistoryTime: "",
      newArr: {},
      messageID: "",
      showMessageError: false,
      jumpAim: "",
      triggered: false,
      isRevoke: false,
      RevokeID: "",
      showName: "",
      isRewrite: false,
      nextReqMessageID: "",
      selectedMessage: {},
      deleteMessage: "",
      errorMessage: {},
      errorMessageID: "",
      resendMessage: {},
      showDownJump: false,
      showNewMessageCount: [],
      isLostsOfUnread: false,
      showUpJump: false,
    });

    useEffect(() => {
      dataRef.current = { ...data, ...conversation };
    }, [data, conversation]);

    useEffect(() => {
      if (conversation.conversationID) {
        getMessageList();
      }
    }, [conversation]);

    useEffect(() => {
      if (unreadCount > 12) {
        if (unreadCount > 99) {
          setData((pre) => ({
            ...pre,
            isLostsOfUnread: true,
            showUpJump: true,
          }));
        } else {
          setData((pre) => ({
            ...pre,
            showUpJump: true,
          }));
        }
      }
      tim.getMyProfile().then((res) => {
        setData((pre) => ({
          ...pre,
          avatar: res.data.avatar,
          userID: res.data.userID,
        }));
      });
      tim.on(tim.EVENT.MESSAGE_RECEIVED, $onMessageReceived);
      return () => {
        // 一定要解除相关的事件绑定
        tim.off(tim.EVENT.MESSAGE_RECEIVED, $onMessageReceived);
      };
    }, []);

    useLayoutEffect(() => {
      videoContextRef.current = Taro.createVideoContext("im-play-video");
    }, []);

    // 拉取更多历史消息渲染时间
    const showMoreHistoryMessageTime = (messageList) => {
      const showHistoryTime = messageList[0].time * 1000;
      Object.assign(messageList[0], {
        isShowMoreHistoryTime: true,
      });
      setData((pre) => ({
        ...pre,
        newArr: {
          ...pre.newArr,
          [messageList[0].ID]: dayjs(showHistoryTime).format(
            "YYYY-MM-DD HH:mm:ss"
          ),
        },
      }));
    };

    // 渲染历史消息时间
    const showHistoryMessageTime = (messageList) => {
      const cut = 30 * 60 * 1000;
      for (let index = 0; index < messageList.length; index++) {
        const nowDayTime = Math.floor(messageList[index].time / 10) * 10 * 1000;
        const firstTime = messageList[0].time * 1000;
        if (nowDayTime - firstTime > cut) {
          const indexButton = messageList
            .map((item) => item)
            .indexOf(messageList[index]); // 获取第一个时间大于30分钟的消息所在位置的下标
          const showHistoryTime =
            Math.floor(messageList[indexButton].time / 10) * 10 * 1000;
          Object.assign(messageList[indexButton], {
            isShowHistoryTime: true,
          });
          setData((pre) => ({
            ...pre,
            firstTime: nowDayTime,
            messageHistoryTime: dayjs(showHistoryTime).format(
              "YYYY-MM-DD HH:mm:ss"
            ),
            showMessageHistoryTime: true,
          }));
          return nowDayTime; // 找到第一个数组时间戳大于30分钟的将其值设为初始值
        }
      }
    };

    // 系统消息去重
    const filterRepateSystemMessage = (messageList) => {
      const noRepateMessage: any = [];
      for (let index = 0; index < messageList.length; index++) {
        if (
          !noRepateMessage.some(
            (item) => item && item.ID === messageList[index].ID
          )
        ) {
          noRepateMessage.push(messageList[index]);
        }
      }
      setData((pre) => ({
        ...pre,
        messageList: noRepateMessage,
      }));
    };

    // 展示消息时间
    const messageTimeForShow = (messageTime) => {
      const interval = 5 * 60 * 1000;
      const nowTime = Math.floor(messageTime.time / 10) * 10 * 1000;
      const { messageList } = dataRef.current!;
      const lastTime = messageList.slice(-1)[0].time * 1000;
      if (nowTime - lastTime > interval) {
        Object.assign(messageTime, {
          isShowTime: true,
        });
        // data.messageTime = dayjs(nowTime);
        setData((pre) => ({
          ...pre,
          messageTime: dayjs(nowTime).format("YYYY-MM-DD HH:mm:ss"),
          showMessageTime: true,
        }));
      }
    };

    // 收到的消息
    const $onMessageReceived = (value) => {
      console.log("收到的消息", value);
      messageTimeForShow(value.data[0]);
      let { showNewMessageCount, showDownJump, messageList, conversationID } =
        dataRef.current!;
      value.data.forEach((item) => {
        if (
          messageList.length > 12 &&
          !value.data[0].isRead &&
          item.conversationID === conversationID
        ) {
          showNewMessageCount.push(value.data[0]);
          showDownJump = true;
        } else {
          showDownJump = true;
        }
      });
      // 若需修改消息，需将内存的消息复制一份，不能直接更改消息，防止修复内存消息，导致其他消息监听处发生消息错误
      const list: any[] = [];
      const lastCustomerService = [...messageList]
        .reverse()
        .find((item) => item.from !== dataRef.current?.userID);
      value.data.forEach((item) => {
        if (item.conversationID === conversationID) {
          list.push(item);
        } else if (
          item.conversationID === "@TIM#SYSTEM" &&
          lastCustomerService
        ) {
          list.push(parseSystemMsg(item, lastCustomerService));
        }
      });
      messageList = messageList.concat(list);
      setData((pre) => ({
        ...pre,
        showNewMessageCount,
        showDownJump,
        messageList: [...messageList],
        groupOptionsNumber: messageList.slice(-1)[0].payload.operationType,
      }));
    };

    // 自己的消息上屏
    const updateMessageList = (message) => {
      messageTimeForShow(message);
      message.isSelf = true;
      data.messageList.push(message);
      setData((pre) => ({
        ...pre,
        lastMessageSequence: pre.messageList.slice(-1)[0].sequence,
        messageList: [...pre.messageList],
        jumpAim: filterSystemMessageID(
          pre.messageList[pre.messageList.length - 1].ID
        ),
      }));
    };

    // 兼容 scrollView
    const filterSystemMessageID = (messageID: string) => {
      const index = messageID.indexOf("@TIM#");
      if (index > -1) {
        return "msg-" + messageID.replace("@TIM#", "");
      }
      return "msg-" + messageID;
    };

    // 历史消息渲染
    const $handleMessageRender = (messageList, currentMessageList) => {
      showHistoryMessageTime(currentMessageList);
      for (let i = 0; i < messageList.length; i++) {
        if (messageList[i].flow === "out") {
          messageList[i].isSelf = true;
        }
      }
      if (messageList.length > 0) {
        if (conversation.type === "@TIM#SYSTEM") {
          filterRepateSystemMessage(messageList);
        } else {
          setData((pre) => ({
            ...pre,
            messageList: [...messageList],
            jumpAim: filterSystemMessageID(
              currentMessageList[currentMessageList.length - 1].ID
            ),
          }));
        }
      }
    };

    // 获取消息列表
    const getMessageList = () => {
      if (!data.isCompleted) {
        const params = {
          conversationID: conversation.conversationID,
          nextReqMessageID: data.nextReqMessageID,
          count: 15,
        };
        console.log(11111111111111, params);
        tim
          .getMessageList(params)
          .then((res) => {
            showMoreHistoryMessageTime(res.data.messageList);
            const { messageList, nextReqMessageID, isCompleted } = res.data; // 消息列表。
            console.log(2222222222, messageList);
            const newMessageList = [...messageList, ...data.messageList];
            setData((pre) => ({
              ...pre,
              nextReqMessageID, // 用于续拉，分页续拉时需传入该字段。
              isCompleted, // 表示是否已经拉完所有消息。
              messageList: newMessageList,
              triggered: false,
            }));
            if (messageList.length > 0 && newMessageList.length < unreadCount) {
              console.log(33333333333);
              getMessageList();
            }
            $handleMessageRender(newMessageList, messageList);
          })
          .catch((error) => console.log(error));
      }
    };

    // 刷新消息列表
    const refresh = () => {
      console.log("refresh");
      if (data.triggered) return;
      if (data.isCompleted) {
        setData((pre) => ({
          ...pre,
          triggered: false,
        }));
        return;
      }
      setData((pre) => ({
        ...pre,
        triggered: true,
      }));
      getMessageList();
    };

    // 滑动到最底部置跳转事件为false
    const scrollHandler = () => {
      setData((pre) => ({
        ...pre,
        jumpAim: filterSystemMessageID(
          pre.messageList[pre.messageList.length - 1].ID
        ),
        showDownJump: false,
      }));
    };

    // 关闭弹窗
    const handleEditToggleAvatar = () => {
      setMsgOperateVisible(false);
    };

    // 获取消息ID
    const handleLongPress = (e: CommonEvent) => {
      e.stopPropagation();
      const { index } = e.currentTarget.dataset;
      setData((pre) => ({
        ...pre,
        messageID: e.currentTarget.id,
        selectedMessage: data.messageList[index],
      }));
      setMsgOperateVisible(true);
    };

    // 复制消息
    const copyMessage = (e: ITouchEvent) => {
      e.stopPropagation();
      Taro.setClipboardData({
        data: data.selectedMessage.payload.text,
        success() {
          Taro.getClipboardData({
            success(res) {
              // logger.log(`| TUI-chat | message-list | copyMessage: ${res.data} `);
            },
          });
        },
      });
      setMsgOperateVisible(false);
    };

    // 更新messagelist
    const updateMessageByID = (deleteMessageID: string) => {
      const { messageList } = dataRef.current!;
      const deleteMessageArr = messageList.filter(
        (item) => item.ID === deleteMessageID
      );
      setData((pre) => ({
        ...pre,
        messageList,
      }));
      return deleteMessageArr;
    };

    // 消息发送失败
    const sendMessageError = (event) => {
      let showMessageError = data.showMessageError;
      if (event.detail.showErrorImageFlag === ImErrorCode.DIRTY_WORDS_CODE) {
        showMessageError = true;
        Taro.showToast({
          title: "您发送的消息包含违禁词汇!",
          duration: 800,
          icon: "none",
        });
      } else if (
        event.detail.showErrorImageFlag === ImErrorCode.UPLOAD_FAIL_CODE
      ) {
        showMessageError = true;
        Taro.showToast({
          title: "文件上传失败!",
          duration: 800,
          icon: "none",
        });
      } else if (
        event.detail.showErrorImageFlag ===
        (ImErrorCode.REQUEST_OVER_TIME_CODE ||
          ImErrorCode.DISCONNECT_NETWORK_CODE)
      ) {
        showMessageError = true;
        Taro.showToast({
          title: "网络已断开!",
          duration: 800,
          icon: "none",
        });
      }
      setData((pre) => ({
        ...pre,
        showMessageError,
        errorMessage: event.detail.message,
        errorMessageID: event.detail.message.ID,
      }));
    };

    // 消息发送失败后重新发送
    const ResndMessage = () => {
      Taro.showModal({
        content: "确认重发该消息？",
        success: (res) => {
          if (res.confirm) {
            tim
              .resendMessage(data.errorMessage) // 传入需要重发的消息实例
              .then(() => {
                Taro.showToast({
                  title: "重发成功!",
                  duration: 800,
                  icon: "none",
                });
                setData((pre) => ({
                  ...pre,
                  showMessageError: false,
                }));
              })
              .catch((imError) => {
                if (imError.code === ImErrorCode.DIRTY_WORDS_CODE) {
                  Taro.showToast({
                    title: "您发送的消息包含违禁词汇!",
                    duration: 800,
                    icon: "none",
                  });
                } else if (imError.code === ImErrorCode.UPLOAD_FAIL_CODE) {
                  Taro.showToast({
                    title: "文件上传失败!",
                    duration: 800,
                    icon: "none",
                  });
                } else if (
                  imError.code ===
                  (ImErrorCode.REQUEST_OVER_TIME_CODE ||
                    ImErrorCode.DISCONNECT_NETWORK_CODE)
                ) {
                  Taro.showToast({
                    title: "网络已断开!",
                    duration: 800,
                    icon: "none",
                  });
                }
              });
          }
        },
      });
    };

    // 消息跳转到最新
    const handleJumpNewMessage = () => {
      console.log("消息跳转到最新");
      setData((pre) => {
        return {
          ...pre,
          jumpAim: filterSystemMessageID(
            pre.messageList[pre.messageList.length - 1].ID
          ),
          showDownJump: false,
          showNewMessageCount: [],
        };
      });
    };
    // 消息跳转到最近未读
    const handleJumpUnreadMessage = () => {
      console.log("消息跳转到最近未读");
      getMessageList();
      if (unreadCount > 15) {
        setData((pre) => ({
          ...pre,
          jumpAim: filterSystemMessageID(
            pre.messageList[pre.messageList.length - unreadCount].ID
          ),
          showUpJump: false,
        }));
      } else {
        setData((pre) => ({
          ...pre,
          jumpAim: filterSystemMessageID(
            pre.messageList[pre.messageList.length - unreadCount].ID
          ),
          showUpJump: false,
        }));
      }
    };

    // 删除处理掉的群通知消息
    const changeSystemMessageList = (event) => {
      updateMessageByID(event.detail.message.ID);
    };

    const openVideo = (val) => {
      setCurrentVideo(val);
      setTimeout(function () {
        // 进入全屏状态
        videoContextRef.current.requestFullScreen();
        videoContextRef.current.play();
      }, 400);
    };

    useEffect(() => {
      console.log("triggered", data.triggered);
    }, [data.triggered]);

    return (
      <View className="im-msg-list">
        <View className="container">
          <ScrollView
            className="message-list-container"
            scrollY
            scrollIntoView={data.jumpAim}
            refresherEnabled
            onRefresherRefresh={refresh}
            refresherTriggered={data.triggered}
            lower-lowerThreshold={200}
            onScrollToLower={scrollHandler}
          >
            {data.isCompleted && <View className="no-message">没有更多啦</View>}
            {conversation?.type !== "@TIM#SYSTEM" &&
              data.messageList.map((item, index) => (
                <View
                  className="t-message"
                  key={index}
                  id={`msg-${item.ID}`}
                  data-index={index}
                >
                  {data.showMessageTime && (
                    <View className="time-pop-mask" data-value={item.time}>
                      {item.isShowTime && (
                        <View className="showmessagetime">
                          {!item.isDeleted && !item.isRevoked && (
                            <Text className="time">{data.messageTime}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                  {data.showMessageHistoryTime && (
                    <View className="time-pop-mask" data-value={item.time}>
                      {item.isShowHistoryTime &&
                        !item.isShowTime &&
                        !item.isShowMoreHistoryTime && (
                          <View className="showmessagetime">
                            {!item.isDeleted && !item.isRevoked && (
                              <Text className="time">
                                {data.messageHistoryTime}
                              </Text>
                            )}
                          </View>
                        )}
                    </View>
                  )}

                  {item.isShowMoreHistoryTime && (
                    <View className="time-pop-mask">
                      <View className="showmessagetime">
                        <Text className="time">{data.newArr[item.ID]}</Text>
                      </View>
                    </View>
                  )}

                  {!item.isDeleted && !item.isRevoked && (
                    <View
                      className="t-message-item"
                      onClick={handleEditToggleAvatar}
                    >
                      {msgOperateVisible && (
                        <View
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditToggleAvatar();
                          }}
                        >
                          {data.messageID === item.ID && (
                            <View
                              className={
                                item.isSelf
                                  ? "label-self-body"
                                  : "label-recieve-body"
                              }
                            >
                              <View className="label-pop-mask">
                                {(item.type === "TIMTextElem" ||
                                  item.type === "TIMFaceElem") && (
                                  <View
                                    className="copymessage"
                                    onClick={copyMessage}
                                  >
                                    <Text>复制</Text>
                                  </View>
                                )}

                                {/* <View
                                  className="deletemessage"
                                  onClick={deleteMessage}
                                >
                                  <Text>｜删除</Text>
                                </View>

                                {item.isSelf && (
                                  <View
                                    className="revokemessage"
                                    onClick={revokeMessage}
                                  >
                                    <Text>｜撤回</Text>
                                  </View>
                                )} */}
                              </View>
                            </View>
                          )}
                        </View>
                      )}

                      {item.type === "TIMGroupTipElem" && (
                        <TipMsg message={item} />
                      )}

                      {item.type !== "TIMGroupTipElem" && (
                        <View
                          className={
                            item.isSelf ? "t-self-message" : "t-recieve-message"
                          }
                        >
                          {!item.isSelf && (
                            <Image
                              className="t-message-avatar"
                              src={
                                item.avatar ||
                                "https://sdk-web-1252463788.cos.ap-hongkong.myqcloud.com/component/TUIKit/assets/avatar_21.png"
                              }
                              data-value={item}
                            />
                          )}
                          {conversation.type === "C2C" && item.flow === "out" && (
                            <View className="read-receipts">
                              <View>{item.isPeerRead ? "已读" : "未读"}</View>
                            </View>
                          )}

                          {((item.isSelf && item.ID === data.errorMessageID) ||
                            item.status === "fail") && (
                            <View className="t-message-error-box">
                              {data.showMessageError && (
                                <Image
                                  className="t-message-error"
                                  src={pictures.msgError}
                                  onClick={ResndMessage}
                                />
                              )}
                            </View>
                          )}

                          <View
                            className={
                              item.isSelf
                                ? "t-self-message-body"
                                : "t-recieve-message-body"
                            }
                            onLongPress={handleLongPress}
                            data-index={index}
                            id={item.ID}
                            message-value={item}
                          >
                            {item.type === "TIMTextElem" && (
                              <TextMsg message={item} isMine={item.isSelf} />
                            )}

                            {item.type === "TIMImageElem" && (
                              <ImageMsg message={item} isMine={item.isSelf} />
                            )}

                            {item.type === "TIMSoundElem" && (
                              <AudioMsg
                                message={item}
                                isMine={item.isSelf}
                                data-index={index}
                                messageList={data.messageList}
                              />
                            )}

                            {item.type === "TIMVideoFileElem" && (
                              <VideoMsg
                                message={item}
                                isMine={item.isSelf}
                                openVideo={openVideo}
                              />
                            )}

                            {item.type === "TIMFaceElem" && (
                              <FaceMsg message="{{item}}" />
                            )}

                            {item.type === "TIMCustomElem" && (
                              <CustomMsg message={item} isMine={item.isSelf} />
                            )}
                            {/* <TUI-FileMessage
                            wx:if="{{item.type === 'TIMFileElem'}}"
                            message="{{item}}"
                            isMine="{{item.isSelf}}"
                          /> */}
                          </View>
                          {item.isSelf && (
                            <Image
                              className="t-message-avatar"
                              src={
                                item.avatar ||
                                "https://sdk-web-1252463788.cos.ap-hongkong.myqcloud.com/component/TUIKit/assets/avatar_21.png"
                              }
                              data-value={item}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}

            {/*filterSystemMessageID unknown  */}
            {conversation.type === "@TIM#SYSTEM" &&
              data.messageList.map((item, index) => (
                <View className="t-message" key={index} data-value={item.ID}>
                  <SystemMsg
                    message={item}
                    onChangeSystemMessageList={changeSystemMessageList}
                  />
                </View>
              ))}

            {/* {data.isRevoke && (
              <View>
                <View className="notice" onClick={resendMessage}>
                  <View className="content">
                    <Text className="revoke">
                      {data.showName}:撤回了一条消息
                    </Text>
                    {data.isRewrite && (
                      <Text className="rewrite">重新编辑</Text>
                    )}
                  </View>
                </View>
              </View>
            )} */}
          </ScrollView>
        </View>

        <PlayVideo
          currentVideo={currentVideo}
          resetCurrentVideo={() => setCurrentVideo({})}
        />

        {data.showDownJump && (
          <View onClick={handleJumpNewMessage}>
            <View className="new-message-item">
              <View className="new-message-box">
                <Image className="icon-left" src={pictures.down} />
                <Text>{data.showNewMessageCount.length}条新消息</Text>
              </View>
            </View>
          </View>
        )}

        {data.showUpJump && (
          <View onClick={handleJumpUnreadMessage}>
            <View className="unread-message-item">
              <View className="unread-message-box">
                <Image className="icon-left" src={pictures.up} />
                <Text>{data.isLostsOfUnread ? "99+" : unreadCount}条未读</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
);
