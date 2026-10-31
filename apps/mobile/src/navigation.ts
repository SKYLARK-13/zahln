export type RootStackParamList = {
  PickUser: undefined;
  Home: undefined;
  Scan: undefined;
  ConfirmPay: { orderId: string };
  PayResult: { paymentId: string };
  History: undefined;
  PaymentDetail: { paymentId: string };
  TillHome: undefined;
  TillWait: { orderId: string };
  TillRefunds: undefined;
  TillRefund: { paymentId: string };
};
