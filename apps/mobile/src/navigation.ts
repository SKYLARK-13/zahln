export type RootStackParamList = {
  PickUser: undefined;
  Home: undefined;
  Scan: undefined;
  ConfirmPay: { orderId: string };
  PayResult: { paymentId: string };
  History: undefined;
  PaymentDetail: { paymentId: string };
};
