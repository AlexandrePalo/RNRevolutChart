import React, { useRef, useLayoutEffect } from 'react'
import { StyleSheet, View, Dimensions, Animated, Text } from 'react-native'
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { svgPathProperties } from 'svg-path-properties'
import { scaleTime, scaleLinear } from 'd3-scale'
import { line, curveBasis } from 'd3-shape'

const { height, width } = new Dimensions.get('window')
const chartHeight = 300
const chartPadding = 0
const cursorSize = 20

const data = [
    { date: new Date(2020, 1, 1), amount: 20 },
    { date: new Date(2020, 1, 2), amount: 100 },
    { date: new Date(2020, 1, 8), amount: 150 },
    { date: new Date(2020, 1, 10), amount: 110 },
    { date: new Date(2020, 1, 20), amount: 120 },
    { date: new Date(2020, 1, 27), amount: 80 },
    { date: new Date(2020, 1, 30), amount: 100 },
    { date: new Date(2020, 2, 3), amount: 200 },
    { date: new Date(2020, 2, 5), amount: 140 },
]
const x = {
    min: new Date(Math.min(...data.map((d) => d.date))),
    max: new Date(Math.max(...data.map((d) => d.date))),
}
const y = {
    min: Math.min(...data.map((d) => d.amount)),
    max: Math.max(...data.map((d) => d.amount)),
}
const xScale = scaleTime()
    .domain([x.min, x.max])
    .range([chartPadding, width - chartPadding])
const yScale = scaleLinear().domain([y.min, y.max]).range([chartHeight, 0])
const path = line()
    .curve(curveBasis)
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.amount))(data)
const properties = new svgPathProperties(path)
const totalPath = properties.getTotalLength() // Total length of the path curve

export default function App() {
    const x = useRef(new Animated.Value(0)).current
    const cursor = useRef(null)
    const label = useRef(null)

    const moveCursor = (value) => {
        // Map position in path to point on layout
        const { x, y } = properties.getPointAtLength(totalPath - value)
        cursor.current.setNativeProps({
            left: x - cursorSize / 2,
            top: y - cursorSize / 2,
        })
    }
    const moveLabel = (value) => {
        // Map position in path to point on layout
        let { x, y } = properties.getPointAtLength(totalPath - value)
        // Clamp min and max value to be sure that the label is fully displayed
        x < 30 && (x = 30)
        x > width - 30 && (x = width - 30)
        label.current.setNativeProps({
            left: x - 20,
            top: y + 20,
        })
    }

    useLayoutEffect(() => {
        // On start
        x.addListener(({ value }) => {
            moveCursor(value)
            moveLabel(value)
        })
        // Initial positions
        moveCursor(0)
        moveLabel(0)
    })

    return (
        <View style={styles.root}>
            <View style={styles.container}>
                <Svg width={width} height={chartHeight}>
                    <Defs>
                        <LinearGradient
                            id="gradient"
                            x1="50%"
                            y1="0%"
                            x2="50%"
                            y2="100%"
                        >
                            <Stop stopColor="#feb2b2" offset="0%" />
                            <Stop stopColor="#FFF" offset="100%" />
                        </LinearGradient>
                    </Defs>
                    <Path d={path} stroke="#fc8181" strokeWidth={3} />
                    <Path
                        d={`${path} L ${
                            width - chartPadding
                        } ${chartHeight} L ${chartPadding} ${chartHeight}`}
                        fill="url(#gradient)"
                    />
                </Svg>
                <Animated.View
                    ref={cursor}
                    style={{
                        ...styles.cursor,
                    }}
                />
                <Animated.View
                    ref={label}
                    style={{
                        ...styles.label,
                    }}
                >
                    <Text>Label</Text>
                </Animated.View>
            </View>
            <Animated.ScrollView
                style={StyleSheet.absoluteFill}
                contentContainerStyle={{ width: 2 * totalPath }}
                horizontal
                scrollEventThrottle={16}
                onScroll={(e) => {
                    Animated.event([
                        {
                            nativeEvent: {
                                contentOffset: {
                                    x,
                                },
                            },
                        },
                    ])(e)
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingTop: 50,
    },
    container: {
        position: 'relative',
    },
    cursor: {
        height: cursorSize,
        width: cursorSize,
        borderRadius: cursorSize / 2,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: '#fc8181',
        position: 'absolute',
    },
    label: {
        backgroundColor: 'white',
        borderRadius: 5,
        position: 'absolute',
        padding: 5,
    },
})
