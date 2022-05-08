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
          "eJyrVgrxCdYrSy1SslIy0jNQ0gHzM1NS80oy0zLBwoZGxiamZlCZ4pTsxIKCzBQlK0MTAwMzc0MjA3OITElmbipQ1MzU0BIIjKGiqRUFmUVAcTMDEwsDA6gZmelAY30yMiMDKyrdg0zNywuqkr0tM5IiAoKzgqIqg108gt21y-2MjCMcLfwLgkJtlWoBe0EwQw__",
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
