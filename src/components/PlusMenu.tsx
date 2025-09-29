import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
	faBolt,
	faComments,
	faDiagramProject,
	faPlus,
	faStar,
	faTimeline,
	faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	TextField,
	useTheme,
} from "@mui/material";
import { useReactFlow } from "@xyflow/react";
import { useSnackbar } from "notistack";
import type React from "react";
import { useCallback, useState } from "react";
import * as model from "../model.js";
import {
	extractAdus,
	generateGraph,
	identifyMajorClaim,
	predictRelations,
} from "../services/assistant.js";
import { addNodeWithSelection, canvasCenter, setState } from "../store.js";

interface ItemProps {
	callback: () => void;
	close: () => void;
	icon: IconProp;
	text: string;
}

const Item: React.FC<ItemProps> = ({ callback, close, icon, text }) => {
	return (
		<MenuItem
			onClick={() => {
				callback();
				close();
			}}
		>
			<ListItemIcon>
				<FontAwesomeIcon icon={icon} />
			</ListItemIcon>
			<ListItemText>{text}</ListItemText>
		</MenuItem>
	);
};

export interface PlusMenuProps {
	plusButton: null | HTMLElement;
	setPlusButton: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
}

export const PlusMenu: React.FC<PlusMenuProps> = ({
	plusButton,
	setPlusButton,
}) => {
	const theme = useTheme();
	const isOpen = Boolean(plusButton);
	const open = (event: React.MouseEvent<HTMLButtonElement>) => {
		setPlusButton(event.currentTarget);
	};
	const close = () => {
		setPlusButton(null);
	};
	const flow = useReactFlow();
	const setIsLoading = useCallback((value: boolean) => {
		setState({ isLoading: value });
	}, []);

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const [assistantCallback, setAssistantCallback] = useState<
		undefined | ((customPrompt: string) => void)
	>(undefined);
	const [customPrompt, setCustomPrompt] = useState("");

	const handleError = useCallback(
		(e: unknown) => {
			let errorMsg = "Unknown error";
			if (typeof e === "string") {
				errorMsg = e.toUpperCase();
			} else if (e instanceof Error) {
				errorMsg = e.message;
			}
			console.log(errorMsg);

			enqueueSnackbar(errorMsg, {
				variant: "error",
				autoHideDuration: 5000,
				action: (key) => (
					<IconButton
						onClick={() => {
							closeSnackbar(key);
						}}
					>
						<FontAwesomeIcon icon={faXmark} />
					</IconButton>
				),
			});
		},
		[closeSnackbar, enqueueSnackbar],
	);

	return (
		<>
			<Box
				className="arguemapper-hidden"
				position="absolute"
				right={10}
				bottom={10}
				zIndex={10}
			>
				<IconButton
					size="large"
					sx={{ backgroundColor: theme.palette.primary.dark }}
					onClick={open}
				>
					<FontAwesomeIcon icon={faBolt} />
				</IconButton>
			</Box>
			<Menu
				open={isOpen}
				onClose={close}
				anchorEl={plusButton}
				sx={{ zIndex: 10, marginBottom: 10 }}
				anchorOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "bottom",
					horizontal: "right",
				}}
			>
				<Item
					callback={() => {
						const { x, y } = flow.screenToFlowPosition(canvasCenter());
						const node = model.initAtom({
							data: { text: "" },
							position: { x, y },
						});

						addNodeWithSelection(node);
					}}
					close={close}
					icon={faPlus}
					text="Add Atom"
				/>
				<Item
					callback={() => {
						const { x, y } = flow.screenToFlowPosition(canvasCenter());
						const node = model.initScheme({ data: {}, position: { x, y } });

						addNodeWithSelection(node);
					}}
					close={close}
					icon={faPlus}
					text="Add Scheme"
				/>
				<Divider />
				<Item
					callback={() => {
						setAssistantCallback(() => (customPrompt: string) => {
							setIsLoading(true);
							generateGraph(customPrompt)
								.catch(handleError)
								.finally(() => setIsLoading(false));
						});
					}}
					close={close}
					icon={faTimeline}
					text="Generate Complete Graph"
				/>
				<Divider />
				<Item
					callback={() => {
						setAssistantCallback(() => (customPrompt: string) => {
							setIsLoading(true);
							extractAdus(customPrompt)
								.catch(handleError)
								.finally(() => setIsLoading(false));
						});
					}}
					close={close}
					icon={faComments}
					text="Extract ADUs"
				/>
				<Item
					callback={() => {
						setAssistantCallback(() => (customPrompt: string) => {
							setIsLoading(true);
							identifyMajorClaim(customPrompt)
								.catch(handleError)
								.finally(() => setIsLoading(false));
						});
					}}
					close={close}
					icon={faStar}
					text="Identify Major Claim"
				/>
				<Item
					callback={() => {
						setAssistantCallback(() => (customPrompt: string) => {
							setIsLoading(true);
							predictRelations(customPrompt)
								.catch(handleError)
								.finally(() => setIsLoading(false));
						});
					}}
					close={close}
					icon={faDiagramProject}
					text="Predict Relations"
				/>
			</Menu>
			<Dialog
				open={assistantCallback !== undefined}
				onClose={() => {
					setAssistantCallback(undefined);
					setCustomPrompt("");
				}}
			>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						assistantCallback?.(customPrompt);
						setAssistantCallback(undefined);
						setCustomPrompt("");
					}}
				>
					<DialogTitle>Prompt Customization</DialogTitle>
					<DialogContent>
						<DialogContentText>
							Adding custom instructions allows you to guide the assistant to
							generate the content you need.
						</DialogContentText>
						<TextField
							label="Custom instructions (optional)"
							autoFocus
							fullWidth
							multiline
							margin="dense"
							value={customPrompt}
							onChange={(event) => {
								setCustomPrompt(event.target.value);
							}}
						/>
					</DialogContent>
					<DialogActions>
						<Button
							onClick={() => {
								setCustomPrompt("");
							}}
						>
							Clear
						</Button>
						<Button type="submit">Start generation</Button>
					</DialogActions>
				</form>
			</Dialog>
		</>
	);
};
