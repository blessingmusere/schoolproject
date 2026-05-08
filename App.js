import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { COLORS, SIZES, FONTS } from './src/constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: ['home-outline', 'home'],
  Add: ['add-circle-outline', 'add-circle'],
  Insights: ['bar-chart-outline', 'bar-chart'],
  Chat: ['chatbubbles-outline', 'chatbubbles'],
  Settings: ['settings-outline', 'settings'],
};

const TabIcon = ({ routeName, label, focused }) => {
  const [inactive, active] = TAB_ICONS[routeName] || TAB_ICONS.Dashboard;

  return (
    <View style={tabStyles.iconWrap}>
      <Ionicons
        name={focused ? active : inactive}
        size={21}
        color={focused ? COLORS.primary : COLORS.textMuted}
      />
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 0.5,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon
            routeName={route.name}
            label={route.name === 'Dashboard' ? 'Home' : route.name}
            focused={focused}
          />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Add" component={AddExpenseScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { session, profile, loading } = useApp();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading SmartSense...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !profile ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  loadingText: { marginTop: 16, fontSize: SIZES.base, color: COLORS.textSecondary },
});

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', minWidth: 56 },
  label: { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },
  labelActive: { color: COLORS.primary, ...FONTS.semibold },
});
