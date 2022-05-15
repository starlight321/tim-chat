import { memo } from "react";
import { View, Image, Text } from "@tarojs/components";
import "./index.scss";

type Props = {
  waitData: any;
};

export default memo<Props>(({ waitData }) => {
  return (
    <View className="im-wait-message">
      <View className="title">
        <View className="logo-wrap">
          <Image
            className="logo"
            src="https://sdk-web-1252463788.cos.ap-hongkong.myqcloud.com/component/TUIKit/assets/avatar_21.png"
          />
          <Text>在线客服</Text>
        </View>
        <View className="status">连线中...</View>
      </View>
      <View className="content">
        正在努力转接到人工服务，当前排队
        <Text className="stress">{waitData.sortNum}</Text>
        人，请稍后。如退出排队请点击<Text className="stress">结束服务</Text>
      </View>
    </View>
  );
});
