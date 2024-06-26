export default function Messages({messages, setMessages}:{
    messages: string[],
    setMessages: (messages: string[]) => void
  }) {
    return <>
      {messages.map((message, i) => <p key={i}>{message}</p>)}
    </>
  }