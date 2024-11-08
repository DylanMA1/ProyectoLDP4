export interface PaymentPlugin {
    renderForm: (options: {
      onSuccess: () => void;
      onFailure: () => void;
    }) => JSX.Element;
  }
  