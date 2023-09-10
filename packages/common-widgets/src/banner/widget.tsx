import React, { FormEvent, useEffect, useState } from "react";
import { AppMessage, Media, WidgetProps } from "@courselit/common-models";
import {
    Image,
    PriceTag,
    TextRenderer,
    Button,
    Form,
    FormField,
} from "@courselit/components-library";
import { actionCreators } from "@courselit/state-management";
import { setAppMessage } from "@courselit/state-management/dist/action-creators";
import { FetchBuilder } from "@courselit/utils";
import { DEFAULT_FAILURE_MESSAGE, DEFAULT_SUCCESS_MESSAGE } from "./constants";
import Settings from "./settings";

export default function Widget({
    settings: {
        title,
        description,
        buttonCaption,
        buttonAction,
        alignment,
        backgroundColor,
        color,
        buttonBackground,
        buttonForeground,
        textAlignment,
        successMessage,
        failureMessage,
        editingViewShowSuccess,
    },
    state,
    pageData: product,
    dispatch,
    editing,
}: WidgetProps<Settings>) {
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);
    const type = Object.keys(product).length === 0 ? "site" : "product";
    const defaultSuccessMessage: Record<string, unknown> = {
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        text: DEFAULT_SUCCESS_MESSAGE,
                    },
                ],
            },
        ],
    };

    let direction: any;
    switch (alignment) {
        case "top":
            direction = "md:!flex-col-reverse";
            break;
        case "bottom":
            direction = "md:!flex-col";
            break;
        case "left":
            direction = "md:!flex-row";
            break;
        case "right":
            direction = "md:!flex-row-reverse";
            break;
        default:
            direction = "md:!flex-row";
    }
    const verticalLayout = ["top", "bottom"].includes(alignment);
    const showEditingView =
        typeof editingViewShowSuccess === "undefined"
            ? 0
            : editingViewShowSuccess;
    const featuredImage: Media =
        type === "site"
            ? state.siteinfo.logo
            : (product.featuredImage as Media);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const mutation = `
            mutation {
                response: sendCourseOverMail(
                    email: "${email}",
                    courseId: "${product.courseId}"
                )
            }
        `;

        const fetch = new FetchBuilder()
            .setUrl(`${state.address.backend}/api/graph`)
            .setPayload(mutation)
            .setIsGraphQLEndpoint(true)
            .build();

        try {
            dispatch(actionCreators.networkAction(true));
            const response = await fetch.exec();
            if (response.response) {
                setEmail("");
                setSuccess(true);
            }
        } catch (e) {
            dispatch(
                setAppMessage(
                    new AppMessage(failureMessage || DEFAULT_FAILURE_MESSAGE),
                ),
            );
        } finally {
            dispatch(actionCreators.networkAction(false));
        }
    };

    useEffect(() => {
        console.log("Product", product, featuredImage, state);
    }, [product]);

    return (
        <section
            className={`flex flex-col space-between ${direction}`}
            style={{
                flexDirection: direction,
                alignItems: !verticalLayout ? "center" : "",
                backgroundColor,
            }}
        >
            {featuredImage && (
                <div
                    className={`p-4 text-center ${
                        verticalLayout ? "md:w-full" : "w-full md:w-1/2"
                    }`}
                >
                    <Image src={featuredImage.file} />
                </div>
            )}
            <div
                className={`p-4 text-center ${
                    verticalLayout ? "md:w-full" : "w-full md:w-1/2"
                }`}
                style={{ color }}
            >
                <div
                    className={`flex flex-col ${
                        textAlignment === "center"
                            ? "items-center"
                            : "items-start"
                    }`}
                >
                    {type !== "site" && (
                        <div className="pb-1">
                            <PriceTag
                                cost={product.cost as number}
                                freeCostCaption="FREE"
                                currencyISOCode={state.siteinfo.currencyISOCode}
                            />
                        </div>
                    )}
                    <div className="pb-1">
                        <h1 className="text-4xl mb-4">
                            {/* @ts-ignore */}
                            {title ||
                                (type === "site"
                                    ? state.siteinfo.title
                                    : product.title)}
                        </h1>
                    </div>
                    {(description || product.description) && (
                        <div
                            className={`pb-4 ${
                                textAlignment === "center"
                                    ? "text-center"
                                    : "text-left"
                            }`}
                        >
                            <TextRenderer
                                json={
                                    description ||
                                    (product.description &&
                                        JSON.parse(
                                            product.description as string,
                                        ))
                                }
                            />
                        </div>
                    )}
                    {type === "product" && product.costType === "email" && (
                        <div>
                            {((editing && showEditingView === 1) ||
                                success) && (
                                <TextRenderer
                                    json={
                                        successMessage || defaultSuccessMessage
                                    }
                                />
                            )}
                            {(!editing || (editing && showEditingView === 0)) &&
                                !success && (
                                    <Form
                                        className="flex flex-col"
                                        onSubmit={onSubmit}
                                    >
                                        <div className="mb-4">
                                            <FormField
                                                label="Email"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                placeholder="Enter your email"
                                                type="email"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Button
                                                style={{
                                                    backgroundColor:
                                                        buttonBackground,
                                                    color: buttonForeground,
                                                }}
                                                type="submit"
                                                disabled={state.networkAction}
                                                component="button"
                                            >
                                                {buttonCaption ||
                                                    "Get for free"}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                        </div>
                    )}
                    {type === "product" &&
                        ["paid", "free"].includes(
                            product.costType as string,
                        ) && (
                            <Button
                                href={`/checkout/${product.courseId}`}
                                component="link"
                                style={{
                                    backgroundColor: buttonBackground,
                                    color: buttonForeground,
                                }}
                            >
                                {buttonCaption || "Buy now"}
                            </Button>
                        )}
                    {type === "site" && buttonAction && (
                        <Button
                            component="link"
                            href={buttonAction}
                            style={{
                                backgroundColor: buttonBackground,
                                color: buttonForeground,
                            }}
                        >
                            {buttonCaption || "Set a URL"}
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}
