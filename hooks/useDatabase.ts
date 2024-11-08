import supabase from '../services/supabaseClient';

export const getSeats = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, zones (id, name, seats (id, state))');
  
    if (error) {
      console.error('Error fetching seats:', error);
      return [];
    }
  
    return data.map(category => ({
      id: category.id,
      name: category.name,
      zones: category.zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        seats: zone.seats.map(seat => ({
          id: seat.id,
          state: seat.state,
        }))
      }))
    }));
  };  
  
  export const updateSeat = async (seatId: number, newState: string) => {
    const { data, error } = await supabase
      .from('seats')
      .update({ state: newState })
      .eq('id', seatId)
      .single();
  
    if (error) {
      console.error('Error updating seat state:', error);
      return { error: 'No se pudo actualizar el estado del asiento' };
    }
  
    return { status: 'updated', seat: data };
  };
  

  
export const checkAvailability = async (category: string, quantity = 1) => {

    const { data: categoryData, error } = await supabase
        .from('categories')
        .select('id, zones (id, name, seats (id, state))')
        .eq('name', category)
        .single();

    if (error || !categoryData) {
        console.error('Category not found:', error);
        return [];
    }

    const zonesWithAvailability = categoryData.zones
        .map(zone => {
          const availableSeats = zone.seats.filter(seat => seat.state !== "No disponible" && seat.state !== "Vendido").length;
          return {
                zone: zone.name,
                available_seats: availableSeats,
            };
        })
        .filter(zone => zone.available_seats >= quantity)
        .sort((a, b) => a.available_seats - b.available_seats)

    return zonesWithAvailability.slice(0, 3);
};


  export const reserveSeats = async (category: any, zone: any, quantity = 1) => {
    const { data: zoneData, error } = await supabase
      .from('zones')
      .select('id, seats (id, reserved, sold)')
      .eq('name', zone)
      .single();
  
    if (error || !zoneData) {
      console.error('Zone not found:', error);
      return { error: 'Zona no encontrada' };
    }
  
    const availableSeats = zoneData.seats.filter(seat => !seat.reserved && !seat.sold);
  
    if (availableSeats.length < quantity) {
      return { error: 'No hay suficientes asientos disponibles' };
    }
  
    const seatsToReserve = availableSeats.slice(0, quantity);
    for (let seat of seatsToReserve) {
      await supabase
        .from('seats')
        .update({ reserved: true })
        .eq('id', seat.id);
    }
  
    return { status: 'reserved', reserved_seats: quantity };
  };

  export const purchaseSeats = async (category: any, zone: any, quantity = 1) => {
    const { data: zoneData, error } = await supabase
      .from('zones')
      .select('id, seats (id, reserved, sold)')
      .eq('name', zone)
      .single();
  
    if (error || !zoneData) {
      console.error('Zone not found:', error);
      return { error: 'Zona no encontrada' };
    }
  
    const reservedSeats = zoneData.seats.filter(seat => seat.reserved);
  
    if (reservedSeats.length < quantity) {
      return { error: 'Reservas insuficientes' };
    }
  
    const seatsToBuy = reservedSeats.slice(0, quantity);
    for (let seat of seatsToBuy) {
      await supabase
        .from('seats')
        .update({ sold: true, reserved: false })
        .eq('id', seat.id);
    }
  
    return { status: 'purchased', purchased_seats: quantity };
  };
  