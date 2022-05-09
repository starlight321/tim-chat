import { memo, useMemo, useState } from "react";
import Taro from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { parseImage } from "@/utils/message-facade";
import "./index.scss";

type Props = {
  message: any;
  isMine: boolean;
};

export default memo<Props>(({ message, isMine = true }) => {
  const [showSave, setShowSave] = useState(false);
  const renderDom = useMemo(() => {
    return parseImage(message || {});
  }, [message]);

  const previewImage = () => {
    Taro.previewImage({
      current: renderDom[0].src, // 当前显示图片的http链接
      urls: [renderDom[0].src], // 图片链接必须是数组
      success: () => {
        setShowSave(true);
      },
      complete: () => {
        setShowSave(false);
      },
    });
  };

  return (
    <View className="im-image-message-wrap" onClick={previewImage}>
      <Image
        className={`image-message ${isMine ? "my-image" : ""}`}
        mode="aspectFill"
        src={renderDom[0].src}
      />
      {showSave && (
        <Image
          className={`image-message ${isMine ? "my-image" : ""}`}
          mode="aspectFill"
          src={renderDom[0].src}
          showMenuByLongpress
        />
      )}
    </View>
  );
});
