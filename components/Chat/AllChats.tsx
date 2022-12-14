import { useEffect, useState } from 'react'
import { View, StyleSheet, Button, Text, FlatList, ScrollView, Alert, TouchableHighlight, Dimensions } from "react-native";
import { supabase } from '../../lib/supabase';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PrivateChat from './ChatPage'


const Stack = createNativeStackNavigator();
const dimensions = Dimensions.get('window')

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        padding: 12,
    },
    verticallySpaced: {
        paddingTop: 5,
        paddingBottom: 5,
        alignSelf: "stretch",
        fontWeight: "bold",
        color: "grey"
    },
    row_data: {
        paddingTop: 10,
        paddingBottom: 10,
        alignSelf: "stretch",
        fontWeight: "bold",
        borderRadius: 4,
        borderColor: "#172343",
        backgroundColor: "#F5DEB3",
        marginHorizontal: 15,
        marginVertical: 20,
    },
    mt20: {
        marginTop: 20,
    },
});

function DisplayAllChats({ navigation }) {
    const [buddyList, setBuddyList] = useState([]);

    useEffect(() => {
        GetBuddyList();
        const unsubscribe = navigation.addListener('focus', async () => {
            await GetBuddyList();
        });
        return unsubscribe;
    }, [navigation])

    async function GetBuddyList() {
        const { data, error } = await supabase.from("profiles").select("friend_list").match({ id: supabase.auth.user()?.id }).single();
        if (error) throw error;
        setBuddyList(data.friend_list);
        console.log(buddyList)
    }
    return (
        <ScrollView>
            {!buddyList.length && <View style={{ height: dimensions.height - 150, alignItems: "center", justifyContent: "center" }}><Text>You have no buddies connected at the moment!</Text>
                <TouchableHighlight underlayColor="grey" onPress={() => { navigation.navigate("Find a buddy") }}><Text style={{ color: "blue" }}>Head over to Find a buddy to find connections!</Text></TouchableHighlight></View>}
            <FlatList
                data={buddyList}
                renderItem={({ item, index }) => (
                    <TouchableHighlight style={{ margin: 10, height: 50, backgroundColor: "#F5DEB3", alignItems: 'center', justifyContent: 'space-evenly', flexDirection: 'row', }} underlayColor={"#F5DEB3"} onPress={() => { navigation.navigate("Private chat", { receiver: item.userID, name: item.username }) }}><View>
                        <Text>{item.username}</Text>
                        </View></TouchableHighlight>
                )} />
        </ScrollView>
    )
}

export default function AllChats() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="All chats" component={DisplayAllChats} />
            <Stack.Screen name="Private chat" component={PrivateChat} options={({ route }) => ({ title: route.params.name })} />
        </Stack.Navigator>
    )
}