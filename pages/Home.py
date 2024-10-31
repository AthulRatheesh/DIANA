import streamlit as st
if st.session_state["user"]:
    pass
else:
    st.switch_page("pages/Login.py")
st.write("Hello")