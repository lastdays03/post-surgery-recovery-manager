
# Onboarding Flow Redesign Plan

## 1. Overview
Redesign the onboarding process to match the new UI/UX requirements:
-   **Step 1 (Chat)**: Interactive chat to identify surgery type and date.
    -   Bot asks for surgery type.
    -   User inputs type -> Bot confirms with "Yes/No" buttons.
    -   If "Yes", Bot asks for surgery date -> Show DatePicker.
    -   After date selection, User clicks "Complete" -> Chat interaction ends.
-   **Step 2 (Health Questionnaire)**: Unified form.
    -   Collects: Age, Weight, Height (Personal Info) and Digestive Capability, Comorbidities (Health Status).
    -   Display "Completion Screen" upon success.

## 2. Architecture Decisions
-   **State Management**: Use `useOnboardingStore`.
-   **Chat Logic**:
    -   Use `messages` state to drive the flow.
    -   Introduce `type` to messages: `text`, `confirm_surgery`, `date_picker`.
-   **Validation**: Zod schema for the unified form.

## 3. Phase Breakdown

### Phase 1: Chat Interaction Refinement
-   **Goal**: Implement "Ask -> Confirm" flow.
-   **Test Strategy**: Test message flow in `onboarding-chat.test.tsx`.
-   [ ] **Red**: Test that entering surgery type triggers confirmation buttons.
-   [ ] **Green**: Implement confirmation UI in chat.

### Phase 2: Date Picker Integration
-   **Goal**: Show Date Picker in chat.
-   [ ] **Red**: Test that confirming surgery triggers date picker.
-   [ ] **Green**: Integrate DatePicker (e.g. `react-day-picker`) as a chat message bubble.

### Phase 3: Unified Health Questionnaire
-   **Goal**: Merge personal and health info inputs.
-   [ ] **Red**: Test form validation for all fields.
-   [ ] **Green**: Create `onboarding-questionnaire.tsx` merging fields.
-   [ ] **Refactor**: Remove old separate step components.

## 4. Quality Gates
-   [ ] Build success.
-   [ ] Tests pass.
-   [ ] Linting pass.
