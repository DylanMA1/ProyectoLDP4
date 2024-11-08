import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
  NativeBaseProvider,
  Button,
  Input,
  View,
  Text,
  Select,
  ScrollView,
  HStack,
  VStack,
  Box,
  useToast,
} from "native-base";
import { getSeats, checkAvailability, updateSeat } from "./hooks/useDatabase";
import { SafeAreaView } from "react-native-safe-area-context";
import supabase from "./services/supabaseClient";
import SimulatedPaymentPlugin from "./components/simulatedPaymentPlugin";

interface Seat {
  id: number;
  state: string;
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
  const toast = useToast();

  useEffect(() => {
    const fetchSeats = async () => {
      const seatData = await getSeats();
      setSeats(seatData);
    };
    fetchSeats();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("seats-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "seats",
        },
        (payload) => {
          const updatedSeat = payload.new as Seat;
          setSeats((prevSeats) => {
            return prevSeats.map((category) => ({
              ...category,
              zones: category.zones.map((zone) => ({
                ...zone,
                seats: zone.seats.map((seat) =>
                  seat.id === updatedSeat.id
                    ? { ...seat, state: updatedSeat.state }
                    : seat
                ),
              })),
            }));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSuccess = async () => {
    console.log("Pago exitoso");
  
    for (let seatId of selectedSeats) {
      await updateSeat(seatId, "Comprado");
    }
  
    setSeats((prevSeats) => {
      return prevSeats.map((category) => ({
        ...category,
        zones: category.zones.map((zone) => ({
          ...zone,
          seats: zone.seats.map((seat) =>
            selectedSeats.has(seat.id)
              ? { ...seat, state: "Comprado" }
              : seat
          ),
        })),
      }));
    });
  
    toast.show({
      title: "Asientos actualizados",
      description: "Todos los asientos seleccionados han sido liberados.",
      variant: "solid",
      duration: 3000,
    });
  };
  

  const handleFailure = () => {
    console.log("Pago fallido");
  };

  const handleCheckAvailability = async () => {
    if (category && quantity) {
      const numericQuantity = parseInt(quantity, 10);
      if (isNaN(numericQuantity)) {
        alert("Por favor ingrese un número válido para la cantidad.");
        return;
      }
      const availableZones = await checkAvailability(category, numericQuantity);
      setAvailability(availableZones);

      toast.show({
        title: "Zonas recomendadas",
        description: availableZones
          .map(
            (zone: any) =>
              `Zona: ${zone.zone}, Asientos disponibles: ${zone.available_seats}`
          )
          .join("\n"),
        variant: "solid",
        duration: 5000,
      });
    }
  };

  const toggleSeatSelection = (seatId: number) => {
    setSelectedSeats((prevSelectedSeats) => {
      const updatedSeats = new Set(prevSelectedSeats);
      if (updatedSeats.has(seatId)) {
        updatedSeats.delete(seatId);
        updateSeat(seatId, "Libre");
      } else {
        updatedSeats.add(seatId);
        updateSeat(seatId, "No disponible");
      }
      return updatedSeats;
    });
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

    const getZoneBackgroundColor = (zoneName: string, categoryName: string) => {
      const availableZone = availability.find(
        (zone: any) => zone.zone === zoneName && category === categoryName
      );
      return availableZone ? "lightgreen" : "gray.200";
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
            {category.name === "VIP" ? (
              <Box
                bgColor={getZoneBackgroundColor(zone.name, "VIP")}
                padding={1}
              >
                <Text
                  marginLeft={2}
                  fontSize="md"
                  fontWeight="semibold"
                  color="gray.500"
                >
                  Zona: {zone.name}
                </Text>
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
                              const seatBgColor = isSelected
                                ? "green.500"
                                : category.name === "VIP"
                                ? "yellow.400"
                                : "red.500";

                              const isDisabled =
                                seat.state !== "Libre" && !isSelected;

                              return (
                                <Button
                                  key={seat.id}
                                  width={10}
                                  height={10}
                                  bg={seatBgColor}
                                  isDisabled={isDisabled}
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
              </Box>
            ) : (
              <>
                <Box
                  width="100%"
                  bg="green.500"
                  height={400}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="white">Estadio</Text>
                </Box>

                <Box
                  bgColor={getZoneBackgroundColor(zone.name, "General")}
                  padding={1}
                >
                  <Text
                    fontSize="md"
                    fontWeight="semibold"
                    color="gray.500"
                    marginLeft={2}
                  >
                    Zona: {zone.name}
                  </Text>
                  <HStack space={1}>
                    {getSeatBlocks(zone.seats, true).map(
                      (block, blockIndex) => (
                        <VStack
                          space={2}
                          padding={2}
                          borderRadius="md"
                          key={blockIndex}
                        >
                          {Array.from({ length: 4 }).map((_, rowIndex) => (
                            <HStack key={rowIndex} space={1}>
                              {block
                                .slice(rowIndex * 5, rowIndex * 5 + 5)
                                .map((seat: Seat) => {
                                  const isSelected = selectedSeats.has(seat.id);
                                  const seatBgColor = isSelected
                                    ? "green.500"
                                    : category.name === "VIP"
                                    ? "yellow.400"
                                    : "red.500";

                                  const isDisabled =
                                    seat.state !== "Libre" && !isSelected;

                                  return (
                                    <Button
                                      key={seat.id}
                                      width={10}
                                      height={10}
                                      bg={seatBgColor}
                                      isDisabled={isDisabled}
                                      onPress={() =>
                                        toggleSeatSelection(seat.id)
                                      }
                                    >
                                      {seat.id}
                                    </Button>
                                  );
                                })}
                            </HStack>
                          ))}
                        </VStack>
                      )
                    )}
                  </HStack>
                </Box>
              </>
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
              onValueChange={setCategory}
            >
              {seats.map((category) => (
                <Select.Item
                  key={category.id}
                  label={category.name}
                  value={category.name}
                />
              ))}
            </Select>

            <Input
              placeholder="Cantidad de asientos"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <Button onPress={handleCheckAvailability}>
              Consultar disponibilidad
            </Button>

            <SimulatedPaymentPlugin.renderForm onSuccess={() => handleSuccess()} onFailure={handleFailure} />

            {renderSeats()}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </NativeBaseProvider>
  );
}

const styles = StyleSheet.create({});
