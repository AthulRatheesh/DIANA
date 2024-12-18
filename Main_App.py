import pages.Login as Login
import streamlit as st

if "is_authenticated" not in st.session_state:
    st.session_state["is_authenticated"] = False
    st.session_state["email"] = None
    st.session_state["username"] = None

if not st.session_state["is_authenticated"]:
    Login.display_loginpage()
    