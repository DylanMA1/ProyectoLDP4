import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import {
  NativeBaseProvider,
  Button,
  Input,
  View,
  Text,
  Select,
  CheckIcon,
  ScrollView,
  HStack,
  VStack,
  SimpleGrid,
} from "native-base";
import { getSeats, checkAvailability } from "./hooks/useDatabase";
import { SafeAreaView } from "react-native-safe-area-context";

interface Seat {
  id: number;
  reserved: boolean;
  sold: boolean;
}

interface Zone {
  id: number;
  name: string;
  seats: Seat[];
}

interface Category {
  id: number;
  name: string;
  zones: Zone[];
}

type SeatsData = Category[];

export default function App() {
  const [seats, setSeats] = useState<SeatsData>([]);
  const [category, setCategory] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [availability, setAvailability] = useState<any>([]);
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchSeats = async () => {
      const seatData = await getSeats();
      setSeats(seatData);
    };
    fetchSeats();
  }, []);

  const handleCheckAvailability = async () => {
    if (category && quantity) {
      const numericQuantity = parseInt(quantity, 10);
      if (isNaN(numericQuantity)) {
        alert("Por favor ingrese un número válido para la cantidad.");
        return;
      }
      const availableZones = await checkAvailability(category, numericQuantity);
      setAvailability(availableZones);
    }
  };

  const toggleSeatSelection = (seatId: number) => {
    setSelectedSeats((prevSelectedSeats) => {
      const updatedSeats = new Set(prevSelectedSeats);
      if (updatedSeats.has(seatId)) {
        updatedSeats.delete(seatId);
      } else {
        updatedSeats.add(seatId);
      }
      return updatedSeats;
    });
  };

  const handlePurchase = () => {
    alert(`Se han comprado ${selectedSeats.size} asientos.`);
    setSelectedSeats(new Set());
  };

  const renderSeats = () => {
    const getSeatBlocks = (seats: Seat[], isGeneral: boolean) => {
      const blockSize = isGeneral ? 20 : 10;
      const blocks = [];
      for (let i = 0; i < seats.length; i += blockSize) {
        blocks.push(seats.slice(i, i + blockSize));
      }
      return blocks;
    };
  
    return seats.map((category) => (
      <ScrollView
        key={category.id}
        style={{ marginVertical: 10 }}
        horizontal={true}
        contentContainerStyle={{ flexGrow: 1 }}
        showsHorizontalScrollIndicator={false}
      >
          {category.zones.map((zone) => (
            <View key={zone.id} style={{ marginVertical: 5 }}>
              <Text fontSize="md" fontWeight="semibold" color="gray.500">
                Zona: {zone.name}
              </Text>
  
              {category.name === "VIP" ? (
                <HStack space={3}>
                  {getSeatBlocks(zone.seats, false).map((block, blockIndex) => (
                    <VStack
                      key={blockIndex}
                      space={2}
                      padding={2}
                      borderRadius="md"
                    >
                      {Array.from({ length: 2 }).map((_, rowIndex) => (
                        <HStack key={rowIndex} space={1}>
                          {block
                            .slice(rowIndex * 5, rowIndex * 5 + 5)
                            .map((seat: Seat) => {
                              const isSelected = selectedSeats.has(seat.id);
                              const seatBgColor = seat.sold
                                ? "red.500"
                                : seat.reserved
                                ? "yellow.400"
                                : isSelected
                                ? "green.500"
                                : "yellow.600";
  
                              return (
                                <Button
                                  key={seat.id}
                                  width={10}
                                  height={10}
                                  bg={seatBgColor}
                                  isDisabled={seat.sold || seat.reserved}
                                  onPress={() => toggleSeatSelection(seat.id)}
                                >
                                  {seat.id}
                                </Button>
                              );
                            })}
                        </HStack>
                      ))}
                    </VStack>
                  ))}
                </HStack>
              ) : (
                <SimpleGrid columns={2} space={0}>
                  {getSeatBlocks(zone.seats, true).map((block, blockIndex) => (
                    <VStack
                      key={blockIndex}
                      space={2}
                      padding={2}
                      borderRadius="md"
                    >
                      {Array.from({ length: 4 }).map((_, rowIndex) => (
                        <HStack key={rowIndex} space={1}>
                          {block
                            .slice(rowIndex * 5, rowIndex * 5 + 5)
                            .map((seat: Seat) => {
                              const isSelected = selectedSeats.has(seat.id);
                              const seatBgColor = seat.sold
                                ? "red.500"
                                : seat.reserved
                                ? "yellow.400"
                                : isSelected
                                ? "green.500"
                                : "brown";
  
                              return (
                                <Button
                                  key={seat.id}
                                  width={10}
                                  height={10}
                                  bg={seatBgColor}
                                  isDisabled={seat.sold || seat.reserved}
                                  onPress={() => toggleSeatSelection(seat.id)}
                                >
                                  {seat.id}
                                </Button>
                              );
                            })}
                        </HStack>
                      ))}
                    </VStack>
                  ))}
                </SimpleGrid>
              )}
            </View>
          ))}
      </ScrollView>
    ));
  };
  

  return (
    <NativeBaseProvider>
      <SafeAreaView>
        <ScrollView>
          <VStack space={4} padding={2}>
            <Select
              selectedValue={category}
              minWidth="200"
              placeholder="Seleccione una categoria"
              onValueChange={(value) => setCategory(value)}
              _selectedItem={{
                bg: "teal.600",
                endIcon: <CheckIcon size={5} />,
              }}
            >
              <Select.Item label="General" value="General" />
              <Select.Item label="VIP" value="VIP" />
            </Select>

            <Input
              placeholder="Cantidad de entradas"
              value={quantity}
              keyboardType="numeric"
              onChangeText={setQuantity}
            />

            <Button onPress={handleCheckAvailability}>
              Verificar Disponibilidad
            </Button>
          </VStack>

          {availability.length > 0 && (
            <View style={{ marginVertical: 10 }}>
              {availability.map((zone: any, index: any) => (
                <Text key={index} color="green.500">
                  Zona: {zone.zone}, Asientos disponibles:{" "}
                  {zone.available_seats}
                </Text>
              ))}
            </View>
          )}

          {renderSeats()}

          {selectedSeats.size > 0 && (
            <Button onPress={handlePurchase} mt={4} colorScheme="blue">
              Comprar {selectedSeats.size} Asientos
            </Button>
          )}

          <StatusBar style="auto" />
        </ScrollView>
      </SafeAreaView>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
