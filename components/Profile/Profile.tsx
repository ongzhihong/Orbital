import { View, Text, Alert, StyleSheet, Image, ScrollView, Dimensions } from "react-native";
import { Input, Button } from "react-native-elements"
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Session, ApiError } from "@supabase/supabase-js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { decode } from 'base64-arraybuffer';
import { EditProfile } from "./EditProfile";
import { SportsProfile } from "./SportsProfile";
import { NewsFeed } from "../NewsFeed/Feed";
import Comments from "../NewsFeed/Comments";
import AddSport from "./AddSport";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {useHeaderHeight} from '@react-navigation/elements';

const dimensions = Dimensions.get('window')

const styles = StyleSheet.create({
    profileImage: {
        width: 200,
        height: 200,

        flexDirection: 'row',
        display: 'flex',

    },
    container: {
        flex: 1,
    },
});

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

export function MyProfile({ route, navigation }) {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [biography, setBiography] = useState("");
    const [avatar_url, setAvatarUrl] = useState("");
    const [session, setSession] = useState<Session | null>(null);
    const [currUser, setCurrUser] = useState("");

    const btmBarHeight = useBottomTabBarHeight();
    const headerHeight = useHeaderHeight();

    useEffect(() => {
        if (route.params.visitor) {
            getProfile(route.params.uuid);
            getCurrUser(supabase.auth.user().id);
        } else {
            setSession(supabase.auth.session());
            if (session) getProfile("");
        }
    }, [session, route.params.visitor]);

    useEffect(() => {
        if (route.params.visitor) {
            return;
        }
        const unsubscribe = navigation.addListener('focus', () => {
            getProfile("");
        });
        return unsubscribe;
    }, [navigation]);

    async function getCurrUser(id){
        let {data,error} = await supabase.from("profiles").select("username").match({id:id}).single();
        setCurrUser(data.username);
        return data.username;
    }

    async function signOut() {
        supabase.auth.signOut();
    }

    const CheckIfFriends = async (id) => {
        const { data, error } = await supabase.from("profiles").select("friend_list").match({ id: supabase.auth.user()?.id }).single();
        if (error) throw error;
        let currFriendList = data.friend_list;
        let alreadyFriends = false;
        currFriendList.forEach(element => {
            if (element.userID == id) alreadyFriends = true;
            return;
        });
        return alreadyFriends
    }

    const Connect = async (id) => {
        let alreadyFriends = await CheckIfFriends(id);
        if (alreadyFriends) {
            Alert.alert("You are already connected");
            return;
        }
        const { data, error } = await supabase.from("profiles").select("connection_requests").match({ id: id }).single();
        if (data) {
            let currConnectionRequests = data.connection_requests;
            let requested = false;
            currConnectionRequests.forEach(element => {
                if (element.userID == supabase.auth.user()?.id) {
                    requested = true;
                    return;
                }
            });
            if (requested) {
                Alert.alert("You have already sent a request");
                return;
            }
            let newConnectionRequest = {
                userID: supabase.auth.user()?.id,
                username: currUser == '' ? await getCurrUser(supabase.auth.user()?.id) : currUser,
                dateRequested: new Date(),
            }
            let newConnectionRequests = [...data.connection_requests, newConnectionRequest]
            const { error } = await supabase.from("profiles").update({ connection_requests: newConnectionRequests }, { returning: "minimal" }).match({ id: id }).single();
            if (error) throw error;
        }
        if (error) throw error;
        Alert.alert("Request to connect sent!")
    }

    async function getProfile(uuid) {
        try {
            setLoading(true);
            const user = supabase.auth.user();
            if (!user) throw new Error("No user on the session!");

            let { data, error, status } = await supabase
                .from("profiles")
                .select(`username, avatar_url, biography`)
                .eq("id", route.params.visitor ? route.params.uuid : user.id)
                .single();
            console.log("here");
            if (error && status !== 406) {
                throw error;
            }
            console.log(data);
            if (data) {
                setUsername(data.username);
                setAvatarUrl(data.avatar_url + '?' + new Date());
                setBiography(data.biography);
            }
        } catch (error) {
            Alert.alert((error as ApiError).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView style={[styles.container, { paddingBottom: 10, height: dimensions.height - btmBarHeight - headerHeight }]}>
            <View style={{ alignItems: 'center' }}><Image style={styles.profileImage} source={{ uri: avatar_url + "?" + new Date() || "https://i.stack.imgur.com/l60Hf.png" }} /></View>
            {!route.params.visitor && <View>
                <Input label="Email" value={session?.user?.email} disabled
                    autoCompleteType={undefined} />
            </View>}
            <View>
                <Input label="Username" value={username} disabled
                    autoCompleteType={undefined} />
            </View>
            <View>
                <Input label="Biography" value={biography} disabled
                    autoCompleteType={undefined} />
            </View>
            {!route.params.visitor &&
                <View style={styles.container}>
                    <View style={{ paddingBottom: 10, marginHorizontal: 10 }}><Button title="Edit Profile" onPress={() => navigation.navigate("Edit Profile")} /></View>
                    <View style={{ paddingBottom: 10, marginHorizontal: 10 }}><Button style={{ paddingBottom: 10 }} title="See My Posts" onPress={() => navigation.navigate("My Posts", { viewOwnPost: true })} /></View>
                    <View style={{ paddingBottom: 10, marginHorizontal: 10 }}><Button style={{ paddingBottom: 10 }} title="See Sports Interests" onPress={() => navigation.navigate("Sports Interests", { id: supabase.auth.user().id, visitor: false })} /></View>
                    <View style={{ paddingBottom: 10, marginHorizontal: 10 }}><Button style={{ paddingBottom: 10 }} title="Sign Out" onPress={() => signOut()} /></View>
                </View>}
            {route.params.visitor &&
                <View>
                    <View style={{ paddingBottom: 10, marginHorizontal: 10 }}><Button title="See Sports Interests" onPress={() => navigation.navigate("User Sport Interests", { id: route.params.uuid, visitor: true })} /></View>
                    <View style={{ paddingBottom: 10, marginHorizontal: 10 }}><Button title="Send Connection Request" onPress={() => Connect(route.params.uuid)} /></View>
                </View>}
        </ScrollView>
    )
}

export function ProfileStack({ navigation }) {
    return (
        <Stack.Navigator>
            <Stack.Screen name="My Profile" component={MyProfile} initialParams={{ visitor: false, uuid: "" }} />
            <Stack.Screen name="User Profile" component={MyProfile} initialParams={{ visitor: false, uuid: "" }} />
            <Stack.Screen name="Edit Profile" component={EditProfile} />
            <Stack.Screen name="My Posts" component={NewsFeed} />
            <Stack.Screen name="Comments" component={Comments} />
            <Stack.Screen name="Sports Interests" component={SportsProfile} />
            <Stack.Screen name="User Sport Interests" component={SportsProfile} />
            <Stack.Screen name="Add Sports" component={AddSport} />
        </Stack.Navigator>
    )
}
