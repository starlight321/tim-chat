import { memo, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import tim from "../../utils/tim";
import "./index.scss";

export default memo(() => {
  useEffect(() => {
    // 开始登录
    tim
      .login({
        userID: "123456",
        userSig:
          "eJwtzFELgjAYheH-suuQb9NtJnQnBBVlFEXdyTbtMxziVhjRf2*ol*c58H7JeXeK3qYnGWERkMW4URvrscKRKYsTLubH6WfZdahJRhMAISkDOT0eWxNUcCoZiJhPaoYO**ACkhRgbmAdsg2-*LooD3tX3daKfvISrq-i2G98czfDwy*t2rYpV9apFfn9AXzEMTc_",
      })
      .then(() => {
        console.log("登录成功");
        Taro.navigateTo({
          url: `/pages/chat/index?conversationInfomation=${JSON.stringify({
            conversationID: "C2C123456",
          })}`,
        });
      })
      .catch((imError) => {
        console.warn("login error:", imError); // 登录失败的相关信息
      });
  }, []);
  return (
    <View>
      <Text>hello world!</Text>
    </View>
  );
});
