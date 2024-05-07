import React, { useEffect, useCallback, useMemo, ReactNode, } from 'react';
import { View, StyleSheet, I18nManager } from "react-native";
import { Gesture, GestureDetector, } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming, } from 'react-native-reanimated';
import { BUTTON_CONTAINER_WIDTH, DEFAULT_DELETE_THRESHOLD, ITEM_HEIGHT, ITEM_WIDTH, MAX_OPPOSITE_TRANSLATION, MIN_DELETE_THRESHOLD, NO_SWIPE_TO_DELETE, SCREEN_WIDTH, THRESHOLD_OPACITY, TRANSLATION_HINT } from '../constants';
import { HiddenButton } from './HiddenButton';




interface SwipeableViewProps {
    children: ReactNode;
    deleteButton?: ReactNode;
    editButton?: ReactNode;
    height?: number | string;
    swipeable?: boolean,
    swipeableHint?: boolean,
    swipeToDelete?: boolean,
    deleteThreshold?: number,
    autoOpened?: boolean,
    bg?: string,
    width?: number | string,
    borderRadius?: number,
    marginTop?: number,
    marginBottom?: number,
    marginStart?: number,
    marginEnd?: number,
    onDelete: () => void,
    onEdit: () => void,

}



export const SwipeableView = ({ children, deleteButton, editButton, height = ITEM_HEIGHT, width = ITEM_WIDTH, swipeable = true, swipeableHint = true, swipeToDelete = true, deleteThreshold = DEFAULT_DELETE_THRESHOLD, autoOpened = false, bg = "#FFFFFF", borderRadius = 0, marginTop = 0, marginBottom = 0, marginStart = 0, marginEnd = 0, onDelete, onEdit }: SwipeableViewProps) => {


    const DELETE_THRESHOLD = swipeToDelete ? Math.max(deleteThreshold, MIN_DELETE_THRESHOLD) : NO_SWIPE_TO_DELETE;

    const containerHeight = useSharedValue(height);
    const translateX = useSharedValue(0);
    const context = useSharedValue({ x: 0 });

    const isSwipeable = useMemo(() => {
        const _isSwipeable = (deleteButton || editButton) && swipeable;
        return _isSwipeable
    }, [swipeable, deleteButton, editButton])



    const buttonsToShow = useMemo(() => {
        return (deleteButton ? 1 : 0) + (editButton ? 1 : 0);
    }, [deleteButton, editButton]);



    const scrollTo = useCallback((destination: number) => {
        'worklet';
        translateX.value = withSpring(destination, { damping: 50 })
    }, [])


    const swipeTillDelete = useCallback(() => {
        'worklet';
        scrollTo(I18nManager.isRTL ? SCREEN_WIDTH : -SCREEN_WIDTH);
        containerHeight.value = withTiming(0, undefined, (isFinished) => {
            if (isFinished && onDelete) {
                runOnJS(onDelete)()
            }
        })
    }, [])



    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value }
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + context.value.x;
            const rtlCondition = Math.max(translateX.value, -MAX_OPPOSITE_TRANSLATION)
            const ltrCondition = Math.min(translateX.value, MAX_OPPOSITE_TRANSLATION)
            const _translate = I18nManager.isRTL ? rtlCondition : ltrCondition;
            translateX.value = isSwipeable ? _translate : 0
        })
        .onEnd(() => {
            if (I18nManager.isRTL) {
                if (translateX.value <= 35) {
                    scrollTo(0)
                }
                if (translateX.value > 35 && translateX.value <= 70) {
                    scrollTo(70)
                }
                if (translateX.value > 70) {
                    if (buttonsToShow == 1) {
                        if (translateX.value > 70 && translateX.value <= DELETE_THRESHOLD) {
                            scrollTo(70)
                        }
                        else {
                            swipeTillDelete()
                        }
                    }
                    else {
                        if (translateX.value > 70 && translateX.value <= 105) {
                            scrollTo(70)
                        }
                        if (translateX.value > 105 && translateX.value <= DELETE_THRESHOLD) {
                            scrollTo(140)
                        }
                        if (translateX.value > DELETE_THRESHOLD) {
                            swipeTillDelete()
                        }
                    }
                }
            }
            else {
                if (translateX.value >= -35) {
                    scrollTo(0)
                }
                if (translateX.value < -35 && translateX.value >= -70) {
                    scrollTo(-70)
                }
                if (translateX.value < -70) {
                    if (buttonsToShow == 1) {
                        if (translateX.value < -70 && translateX.value >= -DELETE_THRESHOLD) {
                            scrollTo(-70)
                        }
                        else {
                            swipeTillDelete()
                        }
                    }
                    else {
                        if (translateX.value < -70 && translateX.value >= -105) {
                            scrollTo(-70)
                        }
                        if (translateX.value < -105 && translateX.value >= -DELETE_THRESHOLD) {
                            scrollTo(-140)
                        }
                        if (translateX.value < -DELETE_THRESHOLD) {
                            swipeTillDelete()
                        }
                    }
                }
            }
        })



    const reanimatedContainerstyle = useAnimatedStyle(() => {
        const rtlOpacity = I18nManager.isRTL && translateX.value > THRESHOLD_OPACITY
        const ltrOpacity = !I18nManager.isRTL && translateX.value < -THRESHOLD_OPACITY
        return {
            height: containerHeight.value,
            opacity: withTiming((rtlOpacity || ltrOpacity) ? 0 : 1)
        }
    })


    const reanimatedVisibleViewStyle = useAnimatedStyle(() => {
        const borderRadiusAnimated = interpolate(translateX.value,
            I18nManager.isRTL ? [0, BUTTON_CONTAINER_WIDTH] : [0, -BUTTON_CONTAINER_WIDTH],
            [borderRadius, 0],
            Extrapolation.CLAMP
        )
        return {
            transform: [{ translateX: translateX.value }],
            borderRadius: borderRadiusAnimated
        }
    })



    useEffect(() => {
        if (autoOpened) {
            if (I18nManager.isRTL) {
                setTimeout(() => {
                    scrollTo(BUTTON_CONTAINER_WIDTH)
                }, 500)
                return
            }
            else {
                setTimeout(() => {
                    scrollTo(-BUTTON_CONTAINER_WIDTH)
                }, 500)
                return
            }
        }
        if (isSwipeable && swipeableHint) {
            if (I18nManager.isRTL) {
                scrollTo(TRANSLATION_HINT)
                setTimeout(() => {
                    scrollTo(0)
                }, 500)
            }
            else {
                scrollTo(-TRANSLATION_HINT)
                setTimeout(() => {
                    scrollTo(0)
                }, 500)
            }
        }
    }, [autoOpened, isSwipeable, swipeableHint])

    return (
        <Animated.View
            style={[reanimatedContainerstyle, {
                width: width,
                backgroundColor: bg,
                marginTop,
                marginBottom,
                marginStart,
                marginEnd,
                alignSelf: 'center'//to delete befor pushing
            }]}>
            <View style={{ ...styles.hiddenView, borderRadius }}>
                {deleteButton &&
                    <HiddenButton
                        onPress={onDelete}
                    >
                        {deleteButton}
                    </HiddenButton>
                }
                {editButton &&
                    <HiddenButton
                        onPress={onEdit}
                    >
                        {editButton}
                    </HiddenButton>
                }
            </View>
            <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.visibleView, { borderRadius }, reanimatedVisibleViewStyle]}>
                    {children}
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    )
}


const styles = StyleSheet.create({
    visibleView: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: "#FFFFFF"
    },
    hiddenView: {
        position: 'absolute',
        height: "100%",
        width: '100%',
        flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
        right: 0,
        overflow: 'hidden',
    },
})



