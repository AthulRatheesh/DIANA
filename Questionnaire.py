import streamlit as st

# Initialize session state to track the current step if not already set
if 'step' not in st.session_state:
    st.session_state.step = 1

# First set of questions
def personal_info():
    with st.form('Personal Info'):
        st.markdown("# :red[Tell us about Yourself]")
        name = st.text_input('Name')
        age = st.number_input('Age', min_value=0, max_value=100, step=1)
        gender = st.selectbox('Gender', ['Male', 'Female', 'Other'])
        submitted = st.form_submit_button('Next')
        
        if submitted:
            # Store the values in session state
            st.session_state['name'] = name
            st.session_state['age'] = age
            st.session_state['gender'] = gender
            # Move to next step
            st.session_state.step += 1
            # Trigger rerun to show next form
            st.rerun()

# Second set of questions (example)
def additional_info():
    with st.form('Physical Metrics'):
        st.markdown("# :red[Physical Metrics]")
        height = st.number_input('Height (cm)', min_value=0.0, max_value=300.0)
        weight = st.number_input('Weight (kg)', min_value=0.0, max_value=500.0)
        body_fat_percentage = st.number_input('Body Fat (percentage)',min_value=0.0,max_value=100.0)
        fitness_level = st.selectbox('Fitness Level',['Beginner','Intermediate','Advanced'])
        submitted = st.form_submit_button('Go')
        
        if submitted:
            # Store the values
            st.session_state['height'] = height
            st.session_state['weight'] = weight
            st.session_state['body_fat_percentage'] =  body_fat_percentage
            st.session_state['fitness_level'] = fitness_level
            st.form_submit_button("Submit")
            # Move to next step
            st.session_state.step += 1
            st.rerun()

# Main flow control
def main():
    if st.session_state.step == 1:
        personal_info()
    elif st.session_state.step == 2:
        additional_info()
    elif st.session_state.step == 3:
        # Show completion message and stored data
        st.success("Thank you for completing the questionnaire!")
        st.write("Your responses:")
        st.write(f"Name: {st.session_state['name']}")
        st.write(f"Age: {st.session_state['age']}")
        st.write(f"Gender: {st.session_state['gender']}")
        st.write(f"Height: {st.session_state['height']}")
        st.write(f"Weight: {st.session_state['weight']}")
        st.write(f"Body Fat Percentage: {st.session_state['body_fat_percentage']}")
        st.write(f"Fitness Level: {st.session_state['fitness_level']}")

if __name__ == "__main__":
    main()
