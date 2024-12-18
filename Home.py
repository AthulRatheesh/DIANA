import streamlit as st

if "is_authenticated" not in st.session_state:
    st.session_state["is_authenticated"] = False
    st.switch_page("pages/Login.py")
else:
    st.title("Welcome to DIANA")
    st.write("This is the main page of the app.")
    col1, col2, col3 = st.columns(3)

    with st.form("Feature1"):
        with col1:
            st.subheader("Recipe Recommender")
            st.write("""💡 Find Recipes That Fit You!
    Discover delicious and healthy recipes tailored to your dietary preferences, restrictions, and fitness goals. Let AI do the meal planning so you can enjoy stress-free cooking!""")
            if st.button("Go"):
                #st.switch_page("pages/Recipe.py")
                st.success("Recipe")

        with col2:
            st.subheader("Personalized Meal Planning")
            st.write("""🍽️ Plan Your Meals!
    Create a personalized meal plan based on your available ingredients and dietary restrictions. Get ready to cook delicious and nutritious meals with ease!""")
            if st.button("Go1"):
                st.success("Meal Planning")

        with col3:
            st.subheader("Nutrition Tracking")
            st.write("""📊 Track Your Nutrition!
    Keep an eye on your nutritional intake and monitor your progress towards your health goals. Stay on top of your diet with our nutrition tracking feature!""")
            if st.button("Go2"):
                st.success("Nutrition Tracking")
    col4, col5 = st.columns(2)

    with col4:
        st.subheader("Chatbot")
        st.write("""🤖 Your Personalized Nutrition Coach
Have questions about your diet or looking for tips to stay healthy? Chat with our AI assistant anytime, anywhere, for instant guidance and support!""")
        if st.button("Go3"):
            st.success("Chatbot")
            st.switch_page("pages/DIANA.py")