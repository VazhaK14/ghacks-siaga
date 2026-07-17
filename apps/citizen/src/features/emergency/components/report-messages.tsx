import { Bubble, BubbleContent } from "@siaga-app/ui/components/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
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
import {
  BotIcon,
  CheckCheckIcon,
  Clock3Icon,
  HeadphonesIcon,
  InfoIcon,
} from "lucide-react";

import type { ReporterReport } from "../types";

type ReportMessage = ReporterReport["messages"][number];

interface PendingMessage {
  content: string;
  createdAt: string;
}

interface ReportMessagesProps {
  isAssistantTyping?: boolean;
  messages: ReporterReport["messages"];
  pendingMessage?: PendingMessage | null;
}

const messageTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const formatMessageTime = (createdAt: string): string => {
  const timestamp = new Date(createdAt);
  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }
  return messageTimeFormatter.format(timestamp);
};

const getSenderLabel = (senderType: ReportMessage["senderType"]): string => {
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

const AssistantAvatar = ({ senderType }: Pick<ReportMessage, "senderType">) => {
  if (senderType === "OPERATOR") {
    return <HeadphonesIcon aria-hidden="true" className="size-4" />;
  }
  if (senderType === "SYSTEM") {
    return <InfoIcon aria-hidden="true" className="size-4" />;
  }
  return <BotIcon aria-hidden="true" className="size-4" />;
};

interface MessageRowProps {
  message: ReportMessage;
}

const MessageRow = ({ message }: MessageRowProps) => {
  const isReporter = message.senderType === "REPORTER";
  const messageTime = formatMessageTime(message.createdAt);

  return (
    <Message align={isReporter ? "end" : "start"}>
      {isReporter ? null : (
        <MessageAvatar className="size-8 border border-primary/25 bg-primary/15 text-primary">
          <AssistantAvatar senderType={message.senderType} />
        </MessageAvatar>
      )}
      <MessageContent className={isReporter ? "items-end" : "items-start"}>
        <MessageHeader className="gap-2 px-1 text-[0.6875rem]">
          <span>{getSenderLabel(message.senderType)}</span>
          {isReporter ? null : (
            <span className="size-1 rounded-full bg-emerald-400" />
          )}
        </MessageHeader>
        <Bubble
          align={isReporter ? "end" : "start"}
          className="max-w-[86%]"
          variant={isReporter ? "default" : "outline"}
        >
          <BubbleContent
            className={
              isReporter
                ? "rounded-2xl rounded-br-md border-primary/20 bg-linear-to-br from-primary to-primary/75 px-3.5 py-2.5 text-sm leading-relaxed shadow-lg shadow-primary/10"
                : "rounded-2xl rounded-bl-md border-white/10 bg-card/80 px-3.5 py-2.5 text-sm leading-relaxed shadow-sm backdrop-blur-xl"
            }
          >
            {message.content}
          </BubbleContent>
        </Bubble>
        <MessageFooter className="gap-1.5 px-1 font-normal text-[0.625rem]">
          <time dateTime={message.createdAt}>{messageTime}</time>
          {isReporter ? (
            <>
              <CheckCheckIcon aria-hidden="true" className="size-3" />
              <span>Terkirim</span>
            </>
          ) : null}
        </MessageFooter>
      </MessageContent>
    </Message>
  );
};

const PendingReporterMessage = ({ content, createdAt }: PendingMessage) => (
  <Message align="end">
    <MessageContent className="items-end opacity-90">
      <MessageHeader className="px-1 text-[0.6875rem]">Kamu</MessageHeader>
      <Bubble align="end" className="max-w-[86%]" variant="default">
        <BubbleContent className="rounded-2xl rounded-br-md border-primary/20 bg-linear-to-br from-primary to-primary/75 px-3.5 py-2.5 text-sm leading-relaxed shadow-lg shadow-primary/10">
          {content}
        </BubbleContent>
      </Bubble>
      <MessageFooter className="gap-1.5 px-1 font-normal text-[0.625rem]">
        <time dateTime={createdAt}>{formatMessageTime(createdAt)}</time>
        <Clock3Icon aria-hidden="true" className="size-3" />
        <span>Mengirim</span>
      </MessageFooter>
    </MessageContent>
  </Message>
);

const AssistantTypingIndicator = () => (
  <Message aria-live="polite" role="status">
    <MessageAvatar className="size-8 border border-primary/25 bg-primary/15 text-primary">
      <BotIcon aria-hidden="true" className="size-4" />
    </MessageAvatar>
    <MessageContent className="items-start">
      <MessageHeader className="gap-2 px-1 text-[0.6875rem]">
        <span>SIAGA AI</span>
        <span className="size-1 rounded-full bg-emerald-400" />
        <span className="font-normal">sedang mengetik</span>
      </MessageHeader>
      <Bubble align="start" variant="outline">
        <BubbleContent
          aria-label="SIAGA AI sedang mengetik"
          className="flex min-w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md border-white/10 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-xl"
        >
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary motion-reduce:animate-none" />
        </BubbleContent>
      </Bubble>
    </MessageContent>
  </Message>
);

export const ReportMessages = ({
  isAssistantTyping = false,
  messages,
  pendingMessage = null,
}: ReportMessagesProps) => (
  <MessageScrollerProvider>
    <MessageScroller className="h-[min(54dvh,34rem)] min-h-80 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center bg-linear-to-b from-card/85 to-transparent pt-3 pb-6">
        <span className="rounded-full border border-white/10 bg-background/45 px-3 py-1 text-[0.625rem] text-muted-foreground backdrop-blur-xl">
          Percakapan berlangsung
        </span>
      </div>
      <MessageScrollerViewport>
        <MessageScrollerContent className="gap-4 px-3 pt-14 pb-5 sm:px-4">
          {messages.map((message) => (
            <MessageScrollerItem key={message.id} scrollAnchor>
              <MessageRow message={message} />
            </MessageScrollerItem>
          ))}
          {pendingMessage ? (
            <MessageScrollerItem scrollAnchor>
              <PendingReporterMessage {...pendingMessage} />
            </MessageScrollerItem>
          ) : null}
          {isAssistantTyping ? (
            <MessageScrollerItem scrollAnchor>
              <AssistantTypingIndicator />
            </MessageScrollerItem>
          ) : null}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton className="bottom-3 shadow-lg" />
    </MessageScroller>
  </MessageScrollerProvider>
);
