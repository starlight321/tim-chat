import { memo, useEffect, useRef, useState } from "react";
import { View } from "@tarojs/components";
import IMInput, { IMInputRef } from "@/components/IMInput";
import IMMsgList, { IMMsgListRef } from "@/components/IMMsgList";
import Taro from "@tarojs/taro";
import tim from "@/utils/tim";
import "./index.scss";

export default memo(() => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [data, setData] = useState<any>({
    conversation: {},
    showChat: true,
    conversationName: "",
  });
  const inputEl = useRef<IMInputRef>(null);
  const contentEl = useRef<IMMsgListRef>(null);

  useEffect(() => {
    const $instance = Taro.getCurrentInstance();
    const payloadData = JSON.parse(
      $instance.router?.params?.conversationInfomation || ""
    );
    setUnreadCount(payloadData.unreadCount || 0);
    if (payloadData?.conversationID) {
      tim.setMessageRead({ conversationID: payloadData.conversationID });
      tim.getConversationProfile(payloadData.conversationID).then((res) => {
        const { conversation } = res.data;
        const conversationName = getConversationName(conversation);
        setData((pre) => ({
          ...pre,
          conversation,
          conversationName,
        }));
        Taro.setNavigationBarTitle({
          title: conversationName,
        });
      });
    }
  }, []);

  const getConversationName = (conversation) => {
    if (conversation.type === "@TIM#SYSTEM") {
      setData((pre) => ({ ...pre, showChat: false }));
      return "系统通知";
    }
    if (conversation.type === "C2C") {
      return (
        conversation.remark ||
        conversation.userProfile.nick ||
        conversation.userProfile.userID
      );
    }
    if (conversation.type === "GROUP") {
      return (
        conversation.groupProfile.name || conversation.groupProfile.groupID
      );
    }
  };

  const sendMessage = (message) => {
    // 将自己发送的消息写进消息列表里面
    console.log("????????", message);
    contentEl.current?.updateMessageList(message);
  };

  const showMessageErrorImage = (event) => {
    contentEl.current?.sendMessageError(event);
  };

  const triggerClose = () => {
    inputEl.current?.handleClose();
  };

  return (
    <View className="im-chat container">
      <View className="message-list" onClick={triggerClose}>
        <IMMsgList
          ref={contentEl}
          conversation={data.conversation}
          unreadCount={unreadCount}
          inputSentMsg={(event) => {
            inputEl.current?.onInputValueChange(event);
          }}
        />
      </View>

      <View className="message-input">
        <IMInput
          ref={inputEl}
          conversation={data.conversation}
          sendMessage={sendMessage}
          showMessageErrorImage={showMessageErrorImage}
        />
      </View>
    </View>
  );
});
