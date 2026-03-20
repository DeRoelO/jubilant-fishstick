export async function getTasksList(accessToken: string) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);

    const options = {
        method: "GET",
        headers: headers
    };

    const response = await fetch("https://graph.microsoft.com/v1.0/me/todo/lists", options);
    return response.json();
}

export async function getTasks(accessToken: string, listId: string) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);

    const options = {
        method: "GET",
        headers: headers
    };

    const response = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks`, options);
    return response.json();
}

export async function updateTask(accessToken: string, listId: string, taskId: string, data: any) {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${accessToken}`);
    headers.append("Content-Type", "application/json");

    const options = {
        method: "PATCH",
        headers: headers,
        body: JSON.stringify(data)
    };

    const response = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${listId}/tasks/${taskId}`, options);
    return response.json();
}
