import { memo, useMemo } from "react";
import { View } from "@tarojs/components";
import { parseGroupTip } from "@/utils/message-facade";
import "./index.scss";

type Props = {
  message: any;
};

export default memo<Props>(({ message }) => {
  const textMessage = useMemo(() => {
    return parseGroupTip(message || {})[0].text;
  }, [message]);

  return (
    <View className="tip-message">
      <View className="text-message">{textMessage}</View>
    </View>
  );
});
