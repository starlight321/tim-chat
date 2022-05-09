import { memo, useMemo } from "react";
import { View, Image, Text } from "@tarojs/components";
import { parseText } from "@/utils/message-facade";
import "./index.scss";

type Props = {
  message: any;
  isMine: boolean;
};

export default memo<Props>(({ message, isMine = true }) => {
  const renderDom = useMemo(() => {
    return parseText(message || {});
  }, [message]);

  return (
    <View className={`im-text-message ${isMine ? "my-text" : ""}`}>
      {renderDom.map((item, index) => (
        <View className="message-body-span" key={index}>
          {item.name === "span" && (
            <Text className="message-body-span-text">{item.text}</Text>
          )}
          {item.name === "img" && (
            <Image className="emoji-icon" src={item.src!} />
          )}
        </View>
      ))}
    </View>
  );
});
