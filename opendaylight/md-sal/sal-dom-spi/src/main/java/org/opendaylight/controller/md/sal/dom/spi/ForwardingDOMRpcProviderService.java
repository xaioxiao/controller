/*
 * Copyright (c) 2015 Cisco Systems, Inc. and others.  All rights reserved.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v1.0 which accompanies this distribution,
 * and is available at http://www.eclipse.org/legal/epl-v10.html
 */
package org.opendaylight.controller.md.sal.dom.spi;

import com.google.common.collect.ForwardingObject;
import java.util.Set;
import org.eclipse.jdt.annotation.NonNull;
import org.opendaylight.controller.md.sal.dom.api.DOMRpcIdentifier;
import org.opendaylight.controller.md.sal.dom.api.DOMRpcImplementation;
import org.opendaylight.controller.md.sal.dom.api.DOMRpcImplementationRegistration;
import org.opendaylight.controller.md.sal.dom.api.DOMRpcProviderService;

/**
 * Utility class which implements {@link DOMRpcProviderService} by forwarding
 * requests to a backing instance.
 *
 * @deprecated Use {@link org.opendaylight.mdsal.dom.spi.ForwardingDOMRpcProviderService} instead.
 */
@Deprecated(forRemoval = true)
public abstract class ForwardingDOMRpcProviderService extends ForwardingObject implements DOMRpcProviderService {
    @Override
    protected abstract @NonNull DOMRpcProviderService delegate();

    @Override
    public <T extends DOMRpcImplementation> DOMRpcImplementationRegistration<T> registerRpcImplementation(
            final T implementation, final DOMRpcIdentifier... types) {
        return delegate().registerRpcImplementation(implementation, types);
    }

    @Override
    public <T extends DOMRpcImplementation> DOMRpcImplementationRegistration<T> registerRpcImplementation(
            final T implementation, final Set<DOMRpcIdentifier> types) {
        return delegate().registerRpcImplementation(implementation, types);
    }
}
