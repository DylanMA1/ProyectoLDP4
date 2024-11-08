import React, { useState } from 'react';
import { Button, Input, Modal, Text, VStack } from 'native-base';
import { PaymentPlugin } from './paymentPlugin';
import { GestureResponderEvent } from 'react-native';

const SimulatedPaymentPlugin: PaymentPlugin = {
  renderForm: ({ onSuccess, onFailure }) => {
    const [cardNumber, setCardNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [message, setMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSubmit = (e: GestureResponderEvent) => {
      e.preventDefault();

      const isPaymentApproved = Math.random() > 0.5;

      if (isPaymentApproved) {
        setMessage("Pago aprobado");
        onSuccess();
      } else {
        setMessage("Pago rechazado");
        onFailure();
      }
      setIsModalOpen(false);
    };

    return (
      <>
        <Button onPress={() => setIsModalOpen(true)}>
          <Text>Pagar con tarjeta de crédito</Text>
        </Button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          size="lg"
        >
          <Modal.Content>
            <Modal.CloseButton />
            <Modal.Header>Pagar con tarjeta de crédito</Modal.Header>
            <Modal.Body>
              <VStack space={4}>
                <Input
                  placeholder="Número de tarjeta"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  isRequired
                />
                <Input
                  placeholder="Fecha de expiración"
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  keyboardType="numeric"
                  isRequired
                />
                <Input
                  placeholder="CVV"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  isRequired
                />
                <Button onPress={handleSubmit} mt={4}>
                  <Text>Pagar</Text>
                </Button>
              </VStack>
              {message && (
                <Text
                  mt={4}
                  color={message === 'Pago aprobado' ? 'green.500' : 'red.500'}
                >
                  {message}
                </Text>
              )}
            </Modal.Body>
          </Modal.Content>
        </Modal>
      </>
    );
  },
};

export default SimulatedPaymentPlugin;
