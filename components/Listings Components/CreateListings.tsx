import { useEffect, useState } from 'react'
import { View, StyleSheet, Button, Text, ScrollView, Alert, Dimensions } from "react-native";
import { Input } from "react-native-elements";
import { NavigationContainer } from '@react-navigation/native';
import LoginSignupScreen from '../Authentication/LoginSignupScreen'
import { Session, ApiError } from "@supabase/supabase-js";
import { supabase } from '../../lib/supabase';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import * as ReactDOM from 'react-dom';
import { renderNode } from 'react-native-elements/dist/helpers';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {useHeaderHeight} from '@react-navigation/elements';
const dimensions = Dimensions.get('window');
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

export default function CreateListing() {
    const [GroupName, setGroupName] = useState('')
    const [Sport, setSport] = useState('')
    const [Description, setDescription] = useState('')
    const [GroupSize, setGroupSize] = useState('0')
    const [isPrivate, setisPrivate] = useState('')
    const [username, setUsername] = useState('')
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getUsername()
    }, [])

    async function getUsername() {
        const { data, error } = await supabase.from("profiles").select("username").match({ id: supabase.auth.user()?.id }).single()
        setUsername(data.username);
    }

    async function generateListing({ GroupName, Sport, Description, GroupSize, isPrivate
    }: {
        GroupName: string;
        Sport: string;
        Description: string;
        GroupSize: string;
        isPrivate: string;
    }) {
        try {
            setLoading(true);
            const user = supabase.auth.user();
            if (!user) throw new Error("No user on the session!");

            console.log(user.id)

            const updates = {
                owner_id: user.id,
                GroupName,
                Sport,
                Description,
                GroupSize,
                isPrivate,
                all_members: [user.id],
                members: [{ uuid: user.id, username: username }]
            };

            if (GroupName == "") {
                Alert.alert("Group name cannot be empty")
            }
            else if (Sport == "") {
                Alert.alert("Sport cannot be empty")
            }
            else {
                let { error } = await supabase
                    .from("listings")
                    .upsert(updates, { returning: "minimal" });
                if (error) {
                    throw error;
                }
            }

        } catch (error) {
            alert((error as ApiError).message);
        } finally {
            setLoading(false);
        }
    }

    function confirm_create({ GroupName, Sport, Description, GroupSize, isPrivate }) {
        if (!GroupName || !Sport || !Description || !GroupSize || !isPrivate) {
            return (
                Alert.alert("Fields cannot be empty")
            )
        }
        if (GroupSize < 1) {
            return (Alert.alert("Group size cannot be less than 1"))
        }
        return (
            Alert.alert(
                "Confirm Create",
                "Confirm Create",
                [
                    {
                        text: "Yes",
                        onPress: () => generateListing({ GroupName, Sport, Description, GroupSize, isPrivate })
                    },
                    {
                        text: "No",
                        onPress: () => console.log("cancel create listing")
                    }
                ]

            )
        )
    }

    return (
        <ScrollView>
            <View style={styles.verticallySpaced}>
                <Input
                    label="Group Name"
                    value={GroupName || ""}
                    onChangeText={(text) => setGroupName(text)}
                    autoCompleteType={undefined} />
            </View>

            <View style={styles.verticallySpaced}>
                <Input
                    label="Sport"
                    value={Sport || ""}
                    onChangeText={(text) => setSport(text)}
                    autoCompleteType={undefined} />
            </View>

            <View style={styles.verticallySpaced}>
                <Input
                    label="Description of your activity"
                    value={Description || ""}
                    onChangeText={(text) => setDescription(text)}
                    autoCompleteType={undefined} />
            </View>

            <View style={styles.verticallySpaced}>
                <Input
                    label="Size of your group"
                    value={GroupSize || ""}
                    onChangeText={(text) => setGroupSize(text)}
                    autoCompleteType={undefined} />
            </View>

            <View style={{flexDirection:'row', justifyContent:'space-evenly'}}>
                <Text style={{fontSize:16}}> Private group?  {isPrivate} </Text>
                <View style={{marginBottom:10, marginLeft:10}}><Button title='Yes' onPress={() => setisPrivate('yes')} /></View>
                <View style={{marginBottom:10, marginRight:10}}><Button title='No' onPress={() => setisPrivate('no')} /></View>
            </View>

            <View style={{marginHorizontal:10}}>
                <Button
                    title={loading ? "Loading ..." : "Create listing"}
                    onPress={() => confirm_create({ GroupName, Sport, Description, GroupSize, isPrivate })}
                    disabled={loading}
                />
            </View>

        </ScrollView>
    )
}