import { Bubble, BubbleContent } from "@siaga-app/ui/components/bubble";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@siaga-app/ui/components/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@siaga-app/ui/components/message-scroller";

import type { ReporterReport } from "../types";

interface ReportMessagesProps {
  messages: ReporterReport["messages"];
}

const getSenderLabel = (
  senderType: ReporterReport["messages"][number]["senderType"]
): string => {
  if (senderType === "REPORTER") {
    return "Kamu";
  }
  if (senderType === "OPERATOR") {
    return "Operator SIAGA";
  }
  if (senderType === "SYSTEM") {
    return "Sistem";
  }
  return "SIAGA AI";
};

export const ReportMessages = ({ messages }: ReportMessagesProps) => (
  <MessageScrollerProvider>
    <MessageScroller className="h-[min(48dvh,28rem)]">
      <MessageScrollerViewport>
        <MessageScrollerContent className="p-4">
          {messages.map((message) => {
            const isReporter = message.senderType === "REPORTER";
            return (
              <MessageScrollerItem key={message.id} scrollAnchor>
                <Message align={isReporter ? "end" : "start"}>
                  <MessageContent>
                    <MessageHeader>
                      {getSenderLabel(message.senderType)}
                    </MessageHeader>
                    <Bubble
                      align={isReporter ? "end" : "start"}
                      variant={isReporter ? "default" : "muted"}
                    >
                      <BubbleContent>{message.content}</BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            );
          })}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  </MessageScrollerProvider>
);
