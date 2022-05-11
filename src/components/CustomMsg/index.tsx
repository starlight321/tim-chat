import { memo, useMemo } from "react";
import { View, Image, Text } from "@tarojs/components";
import "./index.scss";
import { pictures } from "../util";

type Props = {
  message: any;
  isMine: boolean;
};

export default memo<Props>(({ message, isMine = true }) => {
  const parseCustom = (msg) => {
    // 约定自定义消息的 data 字段作为区分，不解析的不进行展示
    if (msg.payload.data === "order") {
      const extension = JSON.parse(msg.payload.extension);
      return {
        type: "order",
        name: "custom",
        title: extension.title || "",
        imageUrl: extension.imageUrl || "",
        price: extension.price || 0,
        description: msg.payload.description,
      };
    }
    // 客服咨询
    if (msg.payload.data === "consultion") {
      const extension = JSON.parse(msg.payload.extension);
      return {
        type: "consultion",
        title: extension.title || "",
        item: extension.item || 0,
        description: extension.description,
      };
    }
    // 服务评价
    if (msg.payload.data === "evaluation") {
      const extension = JSON.parse(msg.payload.extension);
      return {
        type: "evaluation",
        title: msg.payload.description,
        score: extension.score,
        description: extension.comment,
      };
    }
    // 群消息解析
    if (msg.payload.data === "group_create") {
      return {
        type: "group_create",
        text: msg.payload.extension,
      };
    }
    return {
      type: "notSupport",
      text: "[自定义消息]",
    };
  };

  const renderDom = useMemo(() => {
    return parseCustom(message || {});
  }, [message]);

  return (
    <View>
      {renderDom.type === "order" && (
        <View className={`custom-message ${isMine ? "my-custom" : ""}`}>
          <Image className="custom-image" src={renderDom.imageUrl} />
          <View className="custom-content">
            <View className="custom-content-title">{renderDom.title}</View>
            <View className="custom-content-description">
              {renderDom.description}
            </View>
            <View className="custom-content-price">{renderDom.price}</View>
          </View>
        </View>
      )}

      {renderDom.type === "consultion" && (
        <View className={`custom-message ${isMine ? "my-custom" : ""}`}>
          <View className="custom-content">
            <View className="custom-content-title">{renderDom.title}</View>
            {renderDom.item.map((item, index) => (
              <View
                className="custom-content-description"
                key={index}
                id={item.key}
              >
                {item.key}
              </View>
            ))}
            <Text className="custom-content-description">
              {renderDom.description}
            </Text>
          </View>
        </View>
      )}

      {renderDom.type === "evaluation" && (
        <View className={`custom-message ${isMine ? "my-custom" : ""}`}>
          <View className="custom-content">
            <View className="custom-content-title">{renderDom.title}</View>
            <View className="custom-content-score">
              {renderDom.score.map((_, index) => (
                <Image className="score-star" key={index} src={pictures.star} />
              ))}
            </View>
            <View className="custom-content-description">
              {renderDom.description}
            </View>
          </View>
        </View>
      )}

      {renderDom.type === "group_create" && (
        <View className={`custom-message ${isMine ? "my-custom" : ""}`}>
          <View className="custom-content-text">{renderDom.text}</View>
        </View>
      )}

      {renderDom.type === "notSupport" && (
        <View className="message-body-span text-message">
          <View className="message-body-span-text">{renderDom.text}</View>
        </View>
      )}
    </View>
  );
});
