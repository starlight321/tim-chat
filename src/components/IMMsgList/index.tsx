import { memo, useState } from "react";
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
import { pictures } from "./../util";
import "./index.scss";
import TipMsg from "../TipMsg";
import TextMsg from "../TextMsg";
import ImageMsg from "../ImageMsg";
import AudioMsg from "../AudioMsg";
import VideoMsg from "../VideoMsg";
import FaceMsg from "../FaceMsg";

type Props = {
  conversation: {
    conversationID?: string;
    type?: "C2C" | "GROUP" | "@TIM#SYSTEM";
  };
  inputSentMsg: (event) => void;
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
  unreadCount: number;
  selectedMessage: any;
  deleteMessage: string;
  resendMessage: any;
  showDownJump: boolean;
  showNewMessageCount: any[];
  isLostsOfUnread: boolean;
  showUpJump: boolean;
};

const userID = "123456"; // 会从用户的信息中获取到

export default memo<Props>(({ conversation, inputSentMsg }) => {
  const [msgOperateVisible, setMsgOperateVisible] = useState(false);

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
    triggered: true,
    isRevoke: false,
    RevokeID: "",
    showName: "",
    isRewrite: false,
    nextReqMessageID: "",
    unreadCount: 0,
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

  // 兼容 scrollView
  const filterSystemMessageID = (messageID: string) => {
    const index = messageID.indexOf("@TIM#");
    if (index > -1) {
      return messageID.replace("@TIM#", "");
    }
    return messageID;
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
          messageList,
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
      tim
        .getMessageList({
          conversationID: conversation.conversationID,
          nextReqMessageID: data.nextReqMessageID,
          count: 15,
        })
        .then((res) => {
          showMoreHistoryMessageTime(res.data.messageList);
          const { messageList, nextReqMessageID, isCompleted } = res.data; // 消息列表。
          setData((pre) => ({
            ...pre,
            nextReqMessageID, // 用于续拉，分页续拉时需传入该字段。
            isCompleted, // 表示是否已经拉完所有消息。
            messageList: [...messageList, ...pre.messageList],
          }));
          if (
            messageList.length > 0 &&
            data.messageList.length < data.unreadCount
          ) {
            getMessageList();
          }
          $handleMessageRender(data.messageList, messageList);
        });
    }
  };

  // 刷新消息列表
  const refresh = () => {
    if (data.isCompleted) {
      setData((pre) => ({
        ...pre,
        isCompleted: true,
        triggered: false,
      }));
      return;
    }
    getMessageList();
    setTimeout(() => {
      setData((pre) => ({
        ...pre,
        triggered: false,
      }));
    }, 2000);
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
      Show: true,
    }));
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
    const { messageList } = data;
    const deleteMessageArr = messageList.filter(
      (item) => item.ID === deleteMessageID
    );
    setData((pre) => ({
      ...pre,
      messageList,
    }));
    return deleteMessageArr;
  };

  // 删除消息
  const deleteMessage = (e: ITouchEvent) => {
    e.stopPropagation();
    tim
      .deleteMessage([data.selectedMessage])
      .then((imResponse) => {
        updateMessageByID(imResponse.data.messageList[0].ID);
        Taro.showToast({
          title: "删除成功!",
          duration: 800,
          icon: "none",
        });
      })
      .catch(() => {
        Taro.showToast({
          title: "删除失败!",
          duration: 800,
          icon: "error",
        });
      });
  };

  // 撤回消息
  const revokeMessage = () => {
    tim
      .revokeMessage(data.selectedMessage)
      .then((imResponse) => {
        setData((pre) => ({
          ...pre,
          resendMessage: imResponse.data.message,
        }));
        updateMessageByID(imResponse.data.message.ID);
        if (imResponse.data.message.from === userID) {
          setData((pre) => ({
            ...pre,
            showName: "你",
            isRevoke: true,
            isRewrite: true,
          }));
        }
        // 消息撤回成功
      })
      .catch((imError) => {
        Taro.showToast({
          title: "超过2分钟消息不支持撤回",
          duration: 800,
          icon: "none",
        });
        setMsgOperateVisible(false);
        // 消息撤回失败
        console.warn("revokeMessage error:", imError);
      });
  };

  // 消息发送失败后重新发送
  const ResndMessage = () => {
    const DIRTYWORDS_CODE = 80001;
    const UPLOADFAIL_CODE = 6008;
    const REQUESTOVERTIME_CODE = 2081;
    const DISCONNECTNETWORK_CODE = 2800;
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
              if (imError.code === DIRTYWORDS_CODE) {
                Taro.showToast({
                  title: "您发送的消息包含违禁词汇!",
                  duration: 800,
                  icon: "none",
                });
              } else if (imError.code === UPLOADFAIL_CODE) {
                Taro.showToast({
                  title: "文件上传失败!",
                  duration: 800,
                  icon: "none",
                });
              } else if (
                imError.code ===
                (REQUESTOVERTIME_CODE || DISCONNECTNETWORK_CODE)
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

  // 撤回消息重新发送
  const resendMessage = () => {
    tim
      .resendMessage(data.resendMessage)
      .then((imResponse) => {
        // this.triggerEvent("resendMessage", {
        //   message: imResponse.data.message,
        // });
        inputSentMsg({
          detail: {
            message: imResponse.data.message,
          },
        });
        setData((pre) => ({
          ...pre,
          isRevoke: true,
          isRewrite: false,
        }));
      })
      .catch((imError) => {
        Taro.showToast({
          title: "重发失败",
          icon: "none",
        });
        // logger.warn('resendMessage error', imError);
      });
  };

  // 消息跳转到最新
  const handleJumpNewMessage = () => {
    setData((pre) => ({
      ...pre,
      jumpAim: filterSystemMessageID(
        pre.messageList[pre.messageList.length - 1].ID
      ),
      showDownJump: false,
      showNewMessageCount: [],
    }));
  };
  // 消息跳转到最近未读
  const handleJumpUnreadMessage = () => {
    getMessageList();
    if (data.unreadCount > 15) {
      setData((pre) => ({
        ...pre,
        jumpAim: filterSystemMessageID(
          pre.messageList[pre.messageList.length - pre.unreadCount].ID
        ),
        showUpJump: false,
      }));
    } else {
      setData((pre) => ({
        ...pre,
        jumpAim: filterSystemMessageID(
          pre.messageList[pre.messageList.length - pre.unreadCount].ID
        ),
        showUpJump: false,
      }));
    }
  };

  return (
    <>
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
                id={item.ID}
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
                            className={`label-pop ${
                              item.isSelf
                                ? "label-self-body"
                                : "label-recieve-body"
                            }`}
                          >
                            <View className="label-pop-mask">
                              {(item.type === "TIMTextElem" ||
                                item.type === "TIMFaceElem") && (
                                <View
                                  className="copymessage"
                                  onClick={copyMessage}
                                >
                                  <Text>复制｜</Text>
                                </View>
                              )}

                              <View
                                className="deletemessage"
                                onClick={deleteMessage}
                              >
                                <Text>删除</Text>
                              </View>

                              {item.isSelf && (
                                <View
                                  className="revokemessage"
                                  onClick={revokeMessage}
                                >
                                  <Text>｜撤回</Text>
                                </View>
                              )}
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
                            <VideoMsg message={item} isMine={item.isSelf} />
                          )}

                          {item.type === "TIMFaceElem" && (
                            <FaceMsg message="{{item}}" />
                          )}

                          {/* <TUI-CustomMessage
                            wx:if="{{item.type === 'TIMCustomElem'}}"
                            message="{{item}}"
                            isMine="{{item.isSelf}}"
                          /> */}
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
                {/* <TUI-SystemMessage message="{{item}}" bind:changeSystemMessageList="changeSystemMessageList"></TUI-SystemMessage> */}
              </View>
            ))}

          {data.isRevoke && (
            <View>
              <View className="notice" onClick={resendMessage}>
                <View className="content">
                  <Text className="revoke">{data.showName}:撤回了一条消息</Text>
                  {data.isRewrite && <Text className="rewrite">重新编辑</Text>}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

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
              <Text>
                {data.isLostsOfUnread ? "99+" : data.unreadCount}条未读
              </Text>
            </View>
          </View>
        </View>
      )}
    </>
  );
});
