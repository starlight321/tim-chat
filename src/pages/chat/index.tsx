import { memo, useEffect, useMemo, useRef, useState } from "react";
import { View } from "@tarojs/components";
import IMInput, { IMInputRef } from "@/components/IMInput";
import IMMsgList, { IMMsgListRef } from "@/components/IMMsgList";
import Taro from "@tarojs/taro";
import tim from "@/utils/tim";
import eventEmitter from "@/utils/eventEmitter";
import { ImStatus, Conversation } from "@/services";
import "./index.scss";

export default memo(() => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [data, setData] = useState<{
    conversation: Partial<Conversation>;
  }>({
    conversation: {},
    // conversationName: "",
  });
  const [userID, setUserID] = useState("");
  const inputEl = useRef<IMInputRef>(null);
  const contentEl = useRef<IMMsgListRef>(null);

  const onSDKReady = () => {
    const $instance = Taro.getCurrentInstance();
    const payloadData = JSON.parse(
      $instance.router?.params?.conversationInfomation || ""
    );
    if (payloadData.conversationID) {
      payloadData.conversationID = "GROUP" + payloadData.conversationID;
    }

    if (payloadData.status === ImStatus.CONNECT) {
      tim.setMessageRead({ conversationID: payloadData.conversationID });
      setUnreadCount(payloadData.unreadCount || 0);
    }
    setUserID($instance.router?.params?.userID || "");
    setData((pre) => ({
      ...pre,
      conversation: payloadData,
    }));
    // if (payloadData?.conversationID) {
    //   tim.setMessageRead({ conversationID: payloadData.conversationID });
    //   tim.getConversationProfile(payloadData.conversationID).then((res) => {
    //     const { conversation } = res.data;
    //     const conversationName = getConversationName(conversation);
    //     setData((pre) => ({
    //       ...pre,
    //       conversation,
    //       conversationName,
    //     }));
    //   });
    // }
  };

  const toAccount = useMemo(() => {
    if (!data.conversation.conversationID) {
      return "";
    }
    switch (data.conversation.type) {
      case "C2C":
        return data.conversation.conversationID.replace("C2C", "");
      case "GROUP":
        return data.conversation.conversationID.replace("GROUP", "");
      default:
        return data.conversation.conversationID;
    }
  }, [data.conversation]);

  useEffect(() => {
    tim.on(tim.EVENT.SDK_READY, onSDKReady);
    return () => {
      tim.off(tim.EVENT.SDK_READY, onSDKReady);
    };
  }, [toAccount]);

  const changeConversation = (newVal) => {
    if (newVal.conversationID && newVal.conversationID.indexOf("GROUP") < 0) {
      newVal.conversationID = "GROUP" + newVal.conversationID;
    }
    setData((pre) => ({
      ...pre,
      conversation: {
        ...pre.conversation,
        ...newVal,
      },
    }));
  };

  useEffect(() => {
    eventEmitter.on("im_update_conversation", changeConversation);
    return () => {
      eventEmitter.off("im_update_conversation", changeConversation);
    };
  }, []);

  // const getConversationName = (conversation) => {
  //   if (conversation.type === "@TIM#SYSTEM") {
  //     setData((pre) => ({ ...pre, showChat: false }));
  //     return "系统通知";
  //   }
  //   if (conversation.type === "C2C") {
  //     return (
  //       conversation.remark ||
  //       conversation.userProfile.nick ||
  //       conversation.userProfile.userID
  //     );
  //   }
  //   if (conversation.type === "GROUP") {
  //     return (
  //       conversation.groupProfile.name || conversation.groupProfile.groupID
  //     );
  //   }
  // };

  const updateMsgListHandle = (message) => {
    // 将自己发送的消息写进消息列表里面
    console.log("????????", message);
    contentEl.current?.updateMessageList(message);
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
          changeConversation={(val) => setData((pre) => ({ ...pre, val }))}
          inputSentMsg={(event) => {
            inputEl.current?.onInputValueChange(event);
          }}
        />
      </View>

      <View
        className="message-input"
        style={{
          visibility:
            data.conversation?.status === ImStatus.CONNECT
              ? "visible"
              : "hidden",
        }}
      >
        <IMInput
          ref={inputEl}
          conversation={data.conversation}
          toAccount={toAccount}
          updateMsgListHandle={updateMsgListHandle}
          handleJumpBottom={contentEl.current?.handleJumpBottom!}
        />
      </View>
    </View>
  );
});
