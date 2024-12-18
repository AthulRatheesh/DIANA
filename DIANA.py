import streamlit as st
import random
import time

def response_generator():
    response = random.choice(
        [
            "Hello there! How may I help you?",
        "Hi. I'm DIANA. How can I help you?",
        "What can I do for you?"
        ]
    )
    for word in response.split():
        yield word + " "
        time.sleep(0.05)

def display_chatbot():
    if "messages" not in st.session_state:
        st.session_state.messages = []
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    if prompt := st.chat_input("What is up?"):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        with st.chat_message("assistant"):
            response = st.write_stream(response_generator())
        st.session_state.messages.append({"role": "assistant", "content": response})
display_chatbot()