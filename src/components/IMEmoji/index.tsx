import { memo } from "react";
import { ScrollView, View, Image } from "@tarojs/components";
import { emojiList } from "@/utils/emojiMap";
import "./index.scss";

type Props = {
  onChange: (message: string) => void;
};

export default memo<Props>(({ onChange }) => {
  const handleEnterEmoji = (event) => {
    onChange(event.currentTarget.dataset.name);
  };
  return (
    <ScrollView scrollY enableFlex className="im-emoji">
      {emojiList.map((item, i) => (
        <View key={i} className="im-emoji-image">
          <Image
            data-name={item.emojiName}
            src={item.url}
            onClick={handleEnterEmoji}
          />
        </View>
      ))}
    </ScrollView>
  );
});
