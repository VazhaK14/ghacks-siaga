import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export default function DesignSystem() {
  return (
    <Container className="p-6">
      <View className="mb-8 py-4">
        <Text className="text-foreground text-h1">Design System</Text>
      </View>

      <View className="mb-10">
        <Text className="mb-4 text-foreground text-h4">Button</Text>
        <View className="flex-row flex-wrap items-center gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="stroke">Stroke</Button>
        </View>
      </View>
    </Container>
  );
}
