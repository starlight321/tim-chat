import { View } from "@tarojs/components";
import "./index.scss";

const Pending: Taro.FC = () => {
  return (
    <View className="msg-pending">
      <View className="circle" />
    </View>
  );
};

export default Pending;
