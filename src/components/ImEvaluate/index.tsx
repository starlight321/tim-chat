import { memo, useState } from "react";
import { View, Image, Button } from "@tarojs/components";
import "./index.scss";
import { pictures } from "../util";

type Props = {
  lastWaiter: { avatar?: string; name?: string };
};
const scoreList = [1, 2, 3, 4, 5];
export default memo<Props>(({ lastWaiter }) => {
  const [score, setScore] = useState(0);
  return (
    <View className="im-evaluate">
      <Image className="avatar" src={lastWaiter.avatar || ""} />
      <View className="name">{lastWaiter.name || "客服"}</View>
      <View className="score-main">
        {scoreList.map((item) => (
          <Image
            className="star"
            key={item}
            data-score={item}
            src={score >= item ? pictures.star : pictures.starGray}
            onClick={() => setScore(item)}
          />
        ))}
      </View>
      {score > 0 && (
        <Button
          className="submit-btn"
          type="primary"
          onClick={() => {
            console.log("提交评价", score);
          }}
        >
          提交评价
        </Button>
      )}
    </View>
  );
});
