/** @jsx jsx */
import { jsx } from '@emotion/react';
import MyWork from './mywork'
import TimesheetComponent from './timesheet-new'
import HelloWorld from './hello-world'
import React , {useState} from 'react'

import {
    Header,
    NavigationHeader,
    SideNavigation,
    NavigationContent,
    Section,
    LinkItem
} from '@atlaskit/side-navigation';

import { Content, LeftSidebar, Main, PageLayout } from '@atlaskit/page-layout';
import { ExpandLeftSidebarKeyboardShortcut, SlotLabel } from './common';

export default () => {
    const [content, setContent] = useState(null); // Add this state

    const handleLinkClick = (component) => {
        setContent(component);
    }; // Add this function
    return (
        <PageLayout>
            <Content>
                <LeftSidebar width={300} testId="left-sidebar">
                    <ExpandLeftSidebarKeyboardShortcut />

                    <SideNavigation label="Project navigation" testId="side-navigation">
                        <NavigationHeader>
                            <Header description="Sidebar header description">
                                Sidebar Header
                            </Header>
                        </NavigationHeader>
                        <NavigationContent showTopScrollIndicator>
                            <Section>
                                <LinkItem onClick={() => handleLinkClick(<MyWork />)}>My work</LinkItem>
                                <LinkItem onClick={() => handleLinkClick(<HelloWorld />)}>Hello World</LinkItem>
                                <LinkItem onClick={() => handleLinkClick(<TimesheetComponent />)}>Timesheet Component</LinkItem>
                            </Section>
                        </NavigationContent>
                    </SideNavigation>
                </LeftSidebar>

                <Main>
                    <SlotLabel>Main Content</SlotLabel>
                    {content}
                </Main>
            </Content>
        </PageLayout>
    );
};