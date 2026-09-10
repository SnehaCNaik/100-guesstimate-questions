import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ExercisePlayScreen from '../screens/ExercisePlayScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';
import ProgressDashboardScreen from '../screens/ProgressDashboardScreen';
import { colors } from '../theme/colors';
import type { ExerciseDefinition } from '../types';

export type RootStackParamList = {
  Home: undefined;
  ExercisePlay: { exercises: ExerciseDefinition[] };
  SessionSummary: { sessionId: string };
  ProgressDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="ExercisePlay"
          component={ExercisePlayScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} />
        <Stack.Screen name="ProgressDashboard" component={ProgressDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
