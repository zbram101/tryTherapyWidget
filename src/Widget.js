
import {
    MainContainer,
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    ConversationHeader,
    TypingIndicator,
    VoiceCallButton,
    InfoButton,
    Avatar,
  } from "@chatscope/chat-ui-kit-react"
  import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
  import { useState, useRef, useEffect } from 'react'
  import { useChannel } from '@ably-labs/react-hooks'
  import { Types } from "ably"


  import './index.css';
 

    const widgetContainer = document.getElementById('root');
    const prospectID = widgetContainer.getAttribute('prospectId');
    console.log(prospectID, "prospectID")

  const updateChatbotMessage = (conversation, message) => {
    const interactionId = message.data.interactionId;

    const updatedConversation = conversation.reduce((acc, e) => [
        ...acc,
        e.id === interactionId
            ? { ...e, message: e.message + message.data.token }
            : e,
    ], []);

    return conversation.some((e) => e.id === interactionId)
        ? updatedConversation
        : [
            ...updatedConversation,
            {
                id: interactionId,
                message: message.data.token,
                speaker: "bot",
                date: new Date(),
                liked: false,
            },
        ];
};



function Widget() {
    // State variables
    const [text, setText] = useState("");
    const [conversation, setConversation] = useState([]);
    const [botIsTyping, setBotIsTyping] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [ conversationStatus, setConversationSatus] = useState("rootCauseIdentification");
    let typingTimeout = null; // Outside your useChannel hook

    const startChatWithAssistant = () => {
        // Start chat immediately with the assistant
        setSelectedTopic("Help me feel less anxious");
    };

    const setupCall = () => {
        // Logic to set up a call
        console.log("Setting up a call...");
        // You can expand upon this logic or handle the call setup here
    };

    const inputRef = useRef(null);


    useChannel( "2023dcdf-5fd7-41d5-97a0-17ee2b03040d", (message) => {
        switch(message.data.event) {
            case "response": 
                setConversation((state) => updateChatbotMessage(state, message))
                // If there's a previous timer, clear it to prevent multiple timers
                if(typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                // Start a new timer
                typingTimeout = setTimeout(() => {
                    setBotIsTyping(false);
                }, 5000); // 5 seconds
                break;
            case "status":
                setBotIsTyping(message.data.message)
                break;
            case "responseEnd":
            default:
                setBotIsTyping(false);
                // Clear the timer when you receive the responseEnd event
                if(typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                break;
        }
    });


    const sendUserInput = async (input) => {
        // TODO: Add logic for sending user input
        const userMessages = conversation.filter((data) => data.speaker === "user");
        const numberOfUserMessages = userMessages.length;
        let history = conversation.map((data) => data.message).reverse().join("\n");
        console.log(numberOfUserMessages,"conver",conversationStatus)
        try {
            setBotIsTyping(true);
          const response = await fetch("https://fitmentalhelp.com/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ numberOfUserMessages, initialStatus: conversationStatus, history, query: input, userId:prospectID, source:false, streaming:true }), // Include the selected topic in the user input
          });

          const responseData = await response.json();
          const newStatus = responseData.status; // Assuming the API returns the new status
          setConversationSatus(newStatus); // Update the conversation status
        } catch (error) {
          console.error("Error submitting message:", error);
        } finally {
          setBotIsTyping(false);
        }
    };

    const submit = async () => {
        // TODO: Add logic for submitting a message

        setConversation((state) => [
            ... state, {
            message: text,
            speaker: "user",
            date: new Date()
            }
        ])
  
        // Send the user input to the API
        sendUserInput(text);
    
        setText("");
    };

    const emilyIco = "https://trytherapyaiwidget.s3.us-west-1.amazonaws.com/build/AI_therapist_female_headshot.png"

    const handleBackClick = () => {
        setSelectedTopic(null);
    };

    return (
        <div className="widget-container" style={selectedTopic !== null ? { height: '600px' } : {}}>
        {!selectedTopic ? (
            <div>
                <button className="widget-button" onClick={setupCall}>Book Consultation</button>
                <button className="widget-button" onClick={startChatWithAssistant}>Chat Now</button>
            </div>
        ) : (
            // This is your chat UI which appears once "Chat with my AI Assistant Now" is clicked.
                <MainContainer>
                    <ChatContainer>
                        <ConversationHeader>
                            <ConversationHeader.Back onClick={handleBackClick} />
                            <Avatar src={emilyIco} name="Emily" />
                            <ConversationHeader.Content userName="Emily" info="Powered by TherapyAI" />                       
                            <ConversationHeader.Actions>                                                                             
                            {/* <StarButton title="Add to favourites" /> */}
                            <VoiceCallButton title="Start voice call" />
                            {/* <VideoCallButton title="Start video call" /> */}
                            <InfoButton title="Show info" />
                            </ConversationHeader.Actions>
                           
                        </ConversationHeader>

                        <MessageList typingIndicator={botIsTyping && <TypingIndicator content="Therapy AI is typing" />}>
                            {conversation.map((entry, index) => (
                                <Message
                                    key={index}
                                    model={{
                                        type: "custom",
                                        sender: entry.speaker,
                                        position: "single",
                                        direction:
                                          entry.speaker === "bot" ? "incoming" : "outgoing"
                                      }}
                                >
                                                              <Message.CustomContent>
                          <span  dangerouslySetInnerHTML={{__html: entry.message}} />
                          </Message.CustomContent>
                          <Message.Footer
                            // sentTime={timeago.format(entry.date)}
                            sender={entry.speaker === 'bot' ? "Therapy AI": "You"}
                          />

                                    {/* {entry.message} */}
                                </Message>
                            ))}
                        </MessageList>
                        <MessageInput
                            ref={inputRef}
                            placeholder='Type message here'
                            onSend={submit}
                            onChange={(e, value) => setText(value)}
                            sendButton={true}
                            disabled={botIsTyping}
                        />
                    </ChatContainer>
                </MainContainer>
        )}
    </div>
    );
}

export default Widget;