import { memo, useEffect, useState } from "react";
import { View, Text } from "@tarojs/components";
import IMInput from "@/components/IMInput";
import Taro from "@tarojs/taro";
import tim from "@/utils/tim";
import "./index.scss";

export default memo(() => {
  const [conversation, setConversation] = useState({});
  useEffect(() => {
    const $instance = Taro.getCurrentInstance();
    const payloadData = JSON.parse(
      $instance.router?.params?.conversationInfomation || ""
    );
    if (payloadData?.conversationID) {
      tim.getConversationProfile(payloadData.conversationID).then((res) => {
        setConversation(res.data.conversation);
      });
    }
    console.log(payloadData);
  }, []);

  const sendMessage = (message) => {
    // 将自己发送的消息写进消息列表里面
    console.log("????????", message);
    // this.selectComponent("#message-list").updateMessageList(
    //   message
    // );
  };
  return (
    <View>
      <Text>这是聊天页面</Text>
      <IMInput
        conversation={conversation}
        sendMessage={sendMessage}
        showMessageErrorImage={(val) => console.log("error>>>>>>", val)}
      />
    </View>
  );
});