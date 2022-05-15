import { memo, useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View, Button, ScrollView } from "@tarojs/components";
import "./index.scss";

const originData: string[] = [];
for (let i = 120; i > 0; i--) {
  originData.push(`row-${i}`);
}

export default memo(() => {
  const [triggered, setTriggered] = useState(false);
  const [data, setData] = useState<any>([]);
  const [jumpAim, setJumpAim] = useState("");

  const fetchList = () => {
    if (!originData.length) {
      setTimeout(() => {
        setTriggered(false);
      });
      return;
    }
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(originData.splice(0, 30).reverse());
      }, 3000);
    })
      .then((res: string[]) => {
        Taro.stopPullDownRefresh();
        setData((pre) => [...res, ...pre]);
      })
      .finally(() => {
        setTriggered(false);
      });
  };

  const refresh = () => {
    if (triggered) return;
    console.log("refresh");
    setTriggered(true);
    fetchList();
  };

  const scrollHandler = () => {
    console.log("scrollHandler");
  };

  useEffect(() => {
    fetchList();
  }, []);
  return (
    <View className="home">
      <View className="list">
        <ScrollView
          className="container"
          scrollY
          scrollIntoView={jumpAim}
          refresherEnabled
          onRefresherRefresh={refresh}
          refresherTriggered={triggered}
          lower-lowerThreshold={200}
          onScrollToLower={scrollHandler}
        >
          {data.map((i) => (
            <View className="text" key={i} id={i}>
              {i}
            </View>
          ))}
        </ScrollView>
      </View>

      <Button
        type="primary"
        onClick={() => {
          setJumpAim(data[data.length - 1]);
        }}
      >
        登录
      </Button>
    </View>
  );
});
