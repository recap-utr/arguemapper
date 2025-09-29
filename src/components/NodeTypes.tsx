import { Stack, useMediaQuery, useTheme } from "@mui/material";
import * as color from "@mui/material/colors";
import {
	type NodeTypes as FlowNodeTypes,
	Handle,
	type HandleProps,
	type NodeProps,
	Position,
	useConnection,
} from "@xyflow/react";
import { startCase } from "lodash";
import type React from "react";
import { type ComponentType, useMemo } from "react";
import type * as model from "../model.js";
import { useStore } from "../store.js";

const MAX_WIDTH = 300;
const MIN_WIDTH = 100;
const MIN_HEIGHT = 50;

interface NodeHandleProps extends HandleProps {
	isSelected?: boolean;
	nodeId: string;
}

const NodeHandle: React.FC<NodeHandleProps> = (props) => {
	const { isSelected, nodeId, ...handleProps } = props;
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const connection = useConnection();

	// Check if this handle is being targeted during a connection
	const isTargeted = useMemo(() => {
		if (!connection.inProgress) return false;

		if (handleProps.type === "target" && connection.toNode?.id === nodeId) {
			return true;
		}

		if (handleProps.type === "source" && connection.fromNode?.id === nodeId) {
			return true;
		}

		return false;
	}, [connection, handleProps.type, nodeId]);

	const baseSize = isMobile ? 15 : 10;
	const activeSize = isMobile ? 22 : 16;

	const size = isTargeted || isSelected ? activeSize : baseSize;

	const style = useMemo(
		() => ({
			width: size,
			height: size,
			backgroundColor: color.grey[500],
			borderColor: theme.palette.text.primary,
			borderWidth: size / 5,
			transition: "width 0.2s ease, height 0.2s ease, border-width 0.2s ease",
		}),
		[size, theme.palette.text.primary],
	);

	return <Handle {...handleProps} style={style} />;
};

interface NodeComponentProps extends React.PropsWithChildren {
	node: NodeProps<model.Node>;
	bg: string;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
	node,
	bg,
	children,
}) => {
	const theme = useTheme();
	const background = useMemo(
		() =>
			(node.data.userdata as model.Userdata).clickConnect
				? color.orange[500]
				: bg,
		[node.data.userdata, bg],
	);
	const borderColor = useMemo(
		() => (node.selected ? theme.palette.text.primary : background),
		[background, node.selected, theme.palette.text.primary],
	);

	return (
		<Stack
			direction="column"
			justifyContent="center"
			sx={{
				background,
				color: "white",
				padding: 1,
				borderRadius: 2,
				borderColor,
				borderStyle: "solid",
				borderWidth: 2,
				minWidth: MIN_WIDTH,
				maxWidth: MAX_WIDTH,
				minHeight: MIN_HEIGHT,
				textAlign: "center",
			}}
		>
			<NodeHandle
				type="source"
				position={Position.Top}
				isSelected={node.selected}
				nodeId={node.id}
			/>
			{children}
			<NodeHandle
				type="target"
				position={Position.Bottom}
				isSelected={node.selected}
				nodeId={node.id}
			/>
		</Stack>
	);
};

const AtomComponent: ComponentType<NodeProps<model.AtomNode>> = (node) => {
	const body = <div>{node.data.label()}</div>;
	const majorClaim = useStore((state) => state.graph.majorClaim);

	const bg = useMemo(() => {
		if (majorClaim === node.id) {
			return color.blue[900];
		}

		return color.blue[500];
	}, [majorClaim, node.id]);

	return (
		<NodeComponent node={node} bg={bg}>
			{body}
		</NodeComponent>
	);
};

const SchemeComponent: ComponentType<NodeProps<model.SchemeNode>> = (node) => {
	const body = <div>{startCase(node.data.label())}</div>;

	const bg = useMemo(() => {
		if (node.data.scheme.case === "support") {
			return color.green[500];
		}
		if (node.data.scheme.case === "attack") {
			return color.red[500];
		}

		return color.teal[500];
	}, [node.data.scheme]);

	return (
		<NodeComponent node={node} bg={bg}>
			{body}
		</NodeComponent>
	);
};

export const NodeTypes: FlowNodeTypes = {
	atom: AtomComponent,
	scheme: SchemeComponent,
};
