
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
 
import { v4 as uuidv4 } from 'uuid';
const channelId = uuidv4();

    const widgetContainer = document.getElementById('root');
    const prospectID = widgetContainer.getAttribute('prospectId'); // || "customId-created-1234"; //need to remove or condition for production
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
    const [conversationId, setConversationId] = useState();
    const [botIsTyping, setBotIsTyping] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [ conversationStatus, setConversationSatus] = useState("chat");
    let typingTimeout = null; // Outside your useChannel hook
    const [showForm, setShowForm] = useState(false); // State to control showing the email/name form
    const [userDetailsProvided, setUserDetailsProvided] = useState(false); // State to know if user has provided details


    const setupCall = () => {
        // Logic to set up a call
        console.log("Setting up a call...");
        window.open('https://usemotion.com/meet/thomas-melching/meeting?d=25', '_blank');
        // You can expand upon this logic or handle the call setup here
    };

    const inputRef = useRef(null);


    useChannel( channelId, (message) => {
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

    useEffect(() => {
        let botMessage = "";
    
        switch (conversationStatus) {
            case "bookSession":
                botMessage = 'Great! Please book a time with the therapist <a href="https://usemotion.com/meet/thomas-melching/meeting?d=25" target="_blank" rel="noopener noreferrer">here</a>.';
                break;
            case "stuck":
                botMessage = 'It\'s completely okay if you\'re not ready to open up further here. An in-person conversation with a therapist can offer a more personal and understanding environment. If you feel it\'s the right step, I\'d recommend booking a session with the therapist to discuss your experience <a href="https://usemotion.com/meet/thomas-melching/meeting?d=25" target="_blank" rel="noopener noreferrer">here</a>.';
                break;
            default:
                return; // If the status doesn't match any expected values, do nothing.
        }
    
        // Add the message to the conversation
        const botResponse = {
            message: botMessage,
            speaker: "bot",
            date: new Date()
        };
    
        setConversation((state) => [...state, botResponse]);
    
    }, [conversationStatus]); // Only re-run the effect when the conversationStatus changes
    
    const sendUserInput = async (input) => {
        // TODO: Add logic for sending user input
        let history = conversation.map((data) => data.message).reverse().join("\n");
        console.log("conver",conversationStatus)
        try {
            setBotIsTyping(true);
          const response = await fetch("https://fitmentalhelp.com/chat/prospectiveUserChat", { //"https://fitmentalhelp.com/chat" "http://127.0.0.1:3000/chat"
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ conversationId: conversationId, initialStatus: conversationStatus, history, query: input, userId:channelId}), // Include the selected topic in the user input
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
        // Clear the conversation
        setConversation([]);
    
        // Reset the topic selection
        setSelectedTopic(null);
    
        // Indicate the bot isn't typing
        setBotIsTyping(false);
    
        // Reset the conversation status to its initial value
        setConversationSatus("rootCauseIdentification");
    
        // Optionally, if you want to hide the form and reset user detail flags:
        setShowForm(false);
        setUserDetailsProvided(false);
    };
    
    const startChatWithAssistant = () => {
        setShowForm(true); // Show the form to get user's name and email
    };

    const handleUserDetailsSubmission = async (name, email) => {
        console.log("User's name:", name, "User's email:", email);
        setUserDetailsProvided(true);
        setShowForm(false);
        setSelectedTopic("Help me feel less anxious");
    
        try {
            setBotIsTyping(true);
          const response = await fetch("https://fitmentalhelp.com/chat/startProspectiveUserChat", { //"https://fitmentalhelp.com/chat" "http://127.0.0.1:3000/chat"
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, awsId: prospectID}), // Include the selected topic in the user input
          });

          const responseData = await response.json();
          const conversationId = responseData.conversationId; // Assuming the API returns the new status
          console.log(responseData, "responseData from startProspectiveUserChat")
          setConversationId(conversationId);
        } catch (error) {
          console.error("Error submitting message:", error);
        } finally {
          setBotIsTyping(false);
        }

        // Mock a bot response
        const mockedBotResponse = {
            message: "Hello, and thank you for considering booking a session with a therapist. My goal today is to help you find a suitable time and to answer any questions you may have. If you're comfortable, sharing more about what brings you to therapy could be beneficial. Sometimes, just saying the problem out loud—even to an Al—can be a helpful step. The therapist will also receive a summary of our conversation. Would you like to open up about why you're considering therapy, or would you prefer to simply book a call for now?",
            speaker: "bot",
            date: new Date()
        };
    
        // Add the mocked response to the conversation state
        setConversation((state) => [...state, mockedBotResponse]);
    
        // Set bot typing to false
        setBotIsTyping(false);
    };
    
    return (
        <div 
        className="widget-container" 
        style={selectedTopic !== null ? { height: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } : {}}
    >
        {!selectedTopic && !showForm ? (
            <div style={{ flex: 1 }}>
                <button className="widget-button widget-button-chat" onClick={startChatWithAssistant}>Chat Now</button>
            </div>
        ) : showForm && !userDetailsProvided ? (
            <BookingForm onSubmit={handleUserDetailsSubmission} />
        ) : (
            <MainContainer style={{ flex: 1 }}>
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
            {conversationStatus === 'bookSession' ? (
                null
            ) : (
                <div style={{ marginTop: '10px' }}>
                    <button className="widget-button widget-button-book" onClick={setupCall}>Book Consultation</button>
                </div>
            )}
    </div>
    );

}

function BookingForm({ onSubmit }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(true); // Default to true
    const [emailError, setEmailError] = useState(""); // New state for email error message

    // Validate email using regex pattern
    const validateEmail = (email) => {
        let pattern = /^[^ ]+@[^ ]+\.[a-z]{2,6}$/;
        return pattern.test(email);
    }

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (e.target.value === "") {
            setIsEmailValid(true); // no error when field is empty
            setEmailError(""); // clear error message
        } else if (validateEmail(e.target.value)) {
            setIsEmailValid(true);
            setEmailError(""); // clear error message
        } else {
            setIsEmailValid(false);
            setEmailError("Please enter a valid email address.");
        }
    };

    const handleSubmit = () => {
        onSubmit(name, email);
    }
    
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", borderRadius: "8px", boxShadow: "0px 0px 15px rgba(0,0,0,0.1)" }}>
            
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                style={{ padding: "10px", marginBottom: "10px", width: "250px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
            
            <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Email"
                style={{ padding: "10px", marginBottom: "10px", width: "250px", borderRadius: "5px", border: isEmailValid ? "1px solid #ccc" : "1px solid red" }}
            />
            
            {!isEmailValid && <p style={{ color: "red", marginBottom: "20px", marginTop: "-10px" }}>{emailError}</p>}

            <button 
                onClick={handleSubmit} 
                disabled={!isEmailValid || name === "" || email === ""}
                className="widget-button widget-button-book"
                style={{ padding: "10px 20px", backgroundColor: (!isEmailValid || name === "" || email === "") ? "#ccc" : "#007BFF", color: "#fff", borderRadius: "5px", border: "none", cursor: (!isEmailValid || name === "" || email === "") ? "not-allowed" : "pointer" }}
            >
                Continue
            </button>

        </div>
    );
}

export default Widget;