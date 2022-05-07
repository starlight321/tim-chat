import Taro from "@tarojs/taro";
import { memo, useMemo } from "react";
import { View, Image } from "@tarojs/components";
import "./index.scss";

type Props = {
  message: any;
};

const faceBaseUrl = "https://web.sdk.qcloud.com/im/assets/face-elem/";
export default memo<Props>(({ message }) => {
  const faceUrl = useMemo(() => {
    return `${faceBaseUrl + message.payload.data}@2x.png`;
  }, [message]);

  const previewImage = () => {
    Taro.previewImage({
      current: faceUrl, // 当前显示图片的http链接
      urls: [faceUrl],
    });
  };

  return (
    <View className="im-faceMessage" onClick={previewImage}>
      <Image className="face-message" src={faceUrl} />
    </View>
  );
});
