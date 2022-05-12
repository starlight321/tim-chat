import { memo, useMemo } from "react";
import Taro from "@tarojs/taro";
import { View, Map } from "@tarojs/components";
import "./index.scss";
import { pictures } from "./../util";

type Props = {
  message: any;
};

export default memo<Props>(({ message }) => {
  const info = useMemo(() => {
    if (!message) return {};
    const { payload } = message;
    let temp;
    try {
      temp = JSON.parse(payload.description);
    } catch (error) {
      temp = { name: payload.description };
    }
    return {
      ...payload,
      ...temp,
    };
  }, [message]);

  const openMap = () => {
    console.log("openMap");
    const { latitude, longitude, name, address } = info;
    Taro.openLocation({
      latitude,
      longitude,
      name,
      address,
    });
  };

  return (
    <View className="im-location-message" onClick={openMap}>
      <View className="im-location-info">
        <View className="title ellipsis">{info.name}</View>
        {info.address && (
          <View className="address ellipsis">{info.address}</View>
        )}
      </View>
      <Map
        markers={[
          {
            iconPath: pictures.mapMarker,
            latitude: info.latitude,
            longitude: info.longitude,
            width: Taro.pxTransform(70),
            height: Taro.pxTransform(70),
          },
        ]}
        className="im-location-box"
        enableZoom={false}
        enableScroll={false}
        latitude={info.latitude}
        longitude={info.longitude}
      />
    </View>
  );
});
