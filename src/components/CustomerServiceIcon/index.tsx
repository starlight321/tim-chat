import Taro from "@tarojs/taro";
import { memo } from "react";
import { View, Image } from "@tarojs/components";
import { fetchImStatus } from "@/services";
import tim from "@/utils/tim";
import { genTestUserSig } from "@/utils/GenerateTestUserSig";
import { pictures } from "./../util";
import "./index.scss";

type Props = {
  userID: string;
};
export default memo<Props>(({ userID }) => {
  const login = (conversationInfomation: string) => {
    tim
      .login({
        userID,
        userSig: genTestUserSig(userID).userSig,
      })
      .then(() => {
        console.log("登录成功");
        Taro.navigateTo({
          url: `/pages/chat/index?userID=${userID}&conversationInfomation=${conversationInfomation}`,
        });
      })
      .catch((imError) => {
        console.warn("login error:", imError); // 登录失败的相关信息
      });
  };

  const checkStatus = async () => {
    const res = await fetchImStatus(userID, 1);
    console.log(res);
    login(JSON.stringify(res));
  };

  return (
    <View className="im-customer-service-icon-wrap" onClick={checkStatus}>
      <Image className="customer-service-icon" src={pictures.onlineService} />
    </View>
  );
});
