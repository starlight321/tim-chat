import { memo } from "react";
import Taro from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { pictures } from "./../util";
import "./index.scss";

type Props = {
  message: any;
  isMine: boolean;
  openVideo(val): void;
};

export default memo<Props>(({ message, openVideo }) => {
  const { payload } = message;
  return (
    <View className="video-message" onClick={() => openVideo(payload)}>
      <Image className="video-play" src={pictures.play} />
      <Image
        className="video-box"
        src={payload.thumbUrl}
        style={{
          height: Taro.pxTransform(300),
          width: Taro.pxTransform(
            300 / (payload.thumbHeight / payload.thumbWidth)
          ),
        }}
      />
    </View>
  );
});
