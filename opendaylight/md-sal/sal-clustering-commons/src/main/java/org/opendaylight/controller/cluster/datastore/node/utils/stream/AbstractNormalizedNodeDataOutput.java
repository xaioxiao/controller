/*
 * Copyright (c) 2015 Cisco Systems, Inc. and others.  All rights reserved.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v1.0 which accompanies this distribution,
 * and is available at http://www.eclipse.org/legal/epl-v10.html
 */
package org.opendaylight.controller.cluster.datastore.node.utils.stream;

import com.google.common.base.Preconditions;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.io.DataOutput;
import java.io.IOException;
import java.io.OutputStream;
import java.io.StringWriter;
import java.util.Collection;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.TransformerFactoryConfigurationError;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.eclipse.jdt.annotation.NonNull;
import org.opendaylight.yangtools.yang.common.QName;
import org.opendaylight.yangtools.yang.data.api.YangInstanceIdentifier;
import org.opendaylight.yangtools.yang.data.api.YangInstanceIdentifier.AugmentationIdentifier;
import org.opendaylight.yangtools.yang.data.api.YangInstanceIdentifier.NodeIdentifier;
import org.opendaylight.yangtools.yang.data.api.YangInstanceIdentifier.NodeIdentifierWithPredicates;
import org.opendaylight.yangtools.yang.data.api.YangInstanceIdentifier.NodeWithValue;
import org.opendaylight.yangtools.yang.data.api.YangInstanceIdentifier.PathArgument;
import org.opendaylight.yangtools.yang.data.api.schema.NormalizedNode;
import org.opendaylight.yangtools.yang.data.api.schema.stream.NormalizedNodeStreamWriter;
import org.opendaylight.yangtools.yang.data.api.schema.stream.NormalizedNodeWriter;
import org.opendaylight.yangtools.yang.model.api.SchemaPath;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Abstract base class for implementing {@link NormalizedNodeDataOutput} contract. This class uses
 * {@link NormalizedNodeStreamWriter} as an internal interface for performing the actual NormalizedNode writeout,
 * i.e. it will defer to a {@link NormalizedNodeWriter} instance.
 *
 * <p>
 * As such, this is an implementation detail not exposed from this package, hence implementations can rely on the
 * stream being initialized with a header and version.
 */
abstract class AbstractNormalizedNodeDataOutput implements NormalizedNodeDataOutput, NormalizedNodeStreamWriter {
    private static final Logger LOG = LoggerFactory.getLogger(AbstractNormalizedNodeDataOutput.class);

    private final DataOutput output;

    private NormalizedNodeWriter normalizedNodeWriter;
    private boolean headerWritten;
    private QName lastLeafSetQName;

    AbstractNormalizedNodeDataOutput(final DataOutput output) {
        this.output = Preconditions.checkNotNull(output);
    }

    final DataOutput output() {
        return output;
    }

    private void ensureHeaderWritten() throws IOException {
        if (!headerWritten) {
            output.writeByte(TokenTypes.SIGNATURE_MARKER);
            output.writeShort(streamVersion());
            headerWritten = true;
        }
    }

    @Override
    public final void write(final int value) throws IOException {
        ensureHeaderWritten();
        output.write(value);
    }

    @Override
    public final void write(final byte[] bytes) throws IOException {
        ensureHeaderWritten();
        output.write(bytes);
    }

    @Override
    public final void write(final byte[] bytes, final int off, final int len) throws IOException {
        ensureHeaderWritten();
        output.write(bytes, off, len);
    }

    @Override
    public final void writeBoolean(final boolean value) throws IOException {
        ensureHeaderWritten();
        output.writeBoolean(value);
    }

    @Override
    public final void writeByte(final int value) throws IOException {
        ensureHeaderWritten();
        output.writeByte(value);
    }

    @Override
    public final void writeShort(final int value) throws IOException {
        ensureHeaderWritten();
        output.writeShort(value);
    }

    @Override
    public final void writeChar(final int value) throws IOException {
        ensureHeaderWritten();
        output.writeChar(value);
    }

    @Override
    public final void writeInt(final int value) throws IOException {
        ensureHeaderWritten();
        output.writeInt(value);
    }

    @Override
    public final void writeLong(final long value) throws IOException {
        ensureHeaderWritten();
        output.writeLong(value);
    }

    @Override
    public final void writeFloat(final float value) throws IOException {
        ensureHeaderWritten();
        output.writeFloat(value);
    }

    @Override
    public final void writeDouble(final double value) throws IOException {
        ensureHeaderWritten();
        output.writeDouble(value);
    }

    @Override
    public final void writeBytes(final String str) throws IOException {
        ensureHeaderWritten();
        output.writeBytes(str);
    }

    @Override
    public final void writeChars(final String str) throws IOException {
        ensureHeaderWritten();
        output.writeChars(str);
    }

    @Override
    public final void writeUTF(final String str) throws IOException {
        ensureHeaderWritten();
        output.writeUTF(str);
    }

    @Override
    public final void writeNormalizedNode(final NormalizedNode<?, ?> node) throws IOException {
        ensureHeaderWritten();
        if (normalizedNodeWriter == null) {
            normalizedNodeWriter = NormalizedNodeWriter.forStreamWriter(this);
        }
        normalizedNodeWriter.write(node);
    }

    @Override
    public final void writePathArgument(final PathArgument pathArgument) throws IOException {
        ensureHeaderWritten();
        writePathArgumentInternal(pathArgument);
    }

    @Override
    public final void writeYangInstanceIdentifier(final YangInstanceIdentifier identifier) throws IOException {
        ensureHeaderWritten();
        writeYangInstanceIdentifierInternal(identifier);
    }

    @Override
    public final void writeSchemaPath(final SchemaPath path) throws IOException {
        ensureHeaderWritten();
        output.writeBoolean(path.isAbsolute());

        final Collection<QName> qnames = path.getPath();
        output.writeInt(qnames.size());
        for (QName qname : qnames) {
            writeQNameInternal(qname);
        }
    }

    @Override
    public final void close() throws IOException {
        flush();
    }

    @Override
    public void leafNode(final NodeIdentifier name, final Object value) throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Writing a new leaf node");
        startNode(name.getNodeType(), NodeTypes.LEAF_NODE);

        writeObject(value);
    }

    @Override
    public void startLeafSet(final NodeIdentifier name, final int childSizeHint)

            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Starting a new leaf set");

        lastLeafSetQName = name.getNodeType();
        startNode(name.getNodeType(), NodeTypes.LEAF_SET);
    }

    @Override
    public void startOrderedLeafSet(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Starting a new ordered leaf set");

        lastLeafSetQName = name.getNodeType();
        startNode(name.getNodeType(), NodeTypes.ORDERED_LEAF_SET);
    }

    @Override
    public void leafSetEntryNode(final QName name, final Object value) throws IOException, IllegalArgumentException {
        LOG.trace("Writing a new leaf set entry node");

        output.writeByte(NodeTypes.LEAF_SET_ENTRY_NODE);

        // lastLeafSetQName is set if the parent LeafSetNode was previously written. Otherwise this is a
        // stand alone LeafSetEntryNode so write out it's name here.
        if (lastLeafSetQName == null) {
            writeQNameInternal(name);
        }

        writeObject(value);
    }

    @Override
    public void startContainerNode(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");

        LOG.trace("Starting a new container node");

        startNode(name.getNodeType(), NodeTypes.CONTAINER_NODE);
    }

    @Override
    public void startYangModeledAnyXmlNode(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");

        LOG.trace("Starting a new yang modeled anyXml node");

        startNode(name.getNodeType(), NodeTypes.YANG_MODELED_ANY_XML_NODE);
    }

    @Override
    public void startUnkeyedList(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Starting a new unkeyed list");

        startNode(name.getNodeType(), NodeTypes.UNKEYED_LIST);
    }

    @Override
    public void startUnkeyedListItem(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalStateException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Starting a new unkeyed list item");

        startNode(name.getNodeType(), NodeTypes.UNKEYED_LIST_ITEM);
    }

    @Override
    public void startMapNode(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Starting a new map node");

        startNode(name.getNodeType(), NodeTypes.MAP_NODE);
    }

    @Override
    public void startMapEntryNode(final NodeIdentifierWithPredicates identifier, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(identifier, "Node identifier should not be null");
        LOG.trace("Starting a new map entry node");
        startNode(identifier.getNodeType(), NodeTypes.MAP_ENTRY_NODE);

        writeKeyValueMap(identifier.getKeyValues());

    }

    @Override
    public void startOrderedMapNode(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Starting a new ordered map node");

        startNode(name.getNodeType(), NodeTypes.ORDERED_MAP_NODE);
    }

    @Override
    public void startChoiceNode(final NodeIdentifier name, final int childSizeHint)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Starting a new choice node");

        startNode(name.getNodeType(), NodeTypes.CHOICE_NODE);
    }

    @Override
    public void startAugmentationNode(final AugmentationIdentifier identifier)
            throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(identifier, "Node identifier should not be null");
        LOG.trace("Starting a new augmentation node");

        output.writeByte(NodeTypes.AUGMENTATION_NODE);
        writeAugmentationIdentifier(identifier);
    }

    @Override
    public void anyxmlNode(final NodeIdentifier name, final Object value) throws IOException, IllegalArgumentException {
        Preconditions.checkNotNull(name, "Node identifier should not be null");
        LOG.trace("Writing any xml node");

        startNode(name.getNodeType(), NodeTypes.ANY_XML_NODE);

        try {
            StreamResult xmlOutput = new StreamResult(new StringWriter());
            TransformerFactory.newInstance().newTransformer().transform((DOMSource)value, xmlOutput);
            writeObject(xmlOutput.getWriter().toString());
        } catch (TransformerException | TransformerFactoryConfigurationError e) {
            throw new IOException("Error writing anyXml", e);
        }
    }

    @Override
    public void endNode() throws IOException, IllegalStateException {
        LOG.trace("Ending the node");
        lastLeafSetQName = null;
        output.writeByte(NodeTypes.END_NODE);
    }

    @Override
    public void flush() throws IOException {
        if (output instanceof OutputStream) {
            ((OutputStream)output).flush();
        }
    }

    private void startNode(final QName qname, final byte nodeType) throws IOException {
        Preconditions.checkNotNull(qname, "QName of node identifier should not be null.");

        // First write the type of node
        output.writeByte(nodeType);
        // Write Start Tag
        writeQNameInternal(qname);
    }

    final void writeObjSet(final Set<?> set) throws IOException {
        output.writeInt(set.size());
        for (Object o : set) {
            Preconditions.checkArgument(o instanceof String, "Expected value type to be String but was %s (%s)",
                o.getClass(), o);

            writeString((String) o);
        }
    }

    final void writeYangInstanceIdentifierInternal(final YangInstanceIdentifier identifier) throws IOException {
        Collection<PathArgument> pathArguments = identifier.getPathArguments();
        output.writeInt(pathArguments.size());

        for (PathArgument pathArgument : pathArguments) {
            writePathArgumentInternal(pathArgument);
        }
    }

    @SuppressFBWarnings(value = "BC_UNCONFIRMED_CAST",
            justification = "The casts in the switch clauses are indirectly confirmed via the determination of 'type'.")
    final void writePathArgumentInternal(final PathArgument pathArgument) throws IOException {
        final byte type = PathArgumentTypes.getSerializablePathArgumentType(pathArgument);
        output.writeByte(type);

        switch (type) {
            case PathArgumentTypes.NODE_IDENTIFIER:
                NodeIdentifier nodeIdentifier = (NodeIdentifier) pathArgument;
                writeQNameInternal(nodeIdentifier.getNodeType());
                break;
            case PathArgumentTypes.NODE_IDENTIFIER_WITH_PREDICATES:
                NodeIdentifierWithPredicates nodeIdentifierWithPredicates =
                    (NodeIdentifierWithPredicates) pathArgument;
                writeQNameInternal(nodeIdentifierWithPredicates.getNodeType());
                writeKeyValueMap(nodeIdentifierWithPredicates.getKeyValues());
                break;
            case PathArgumentTypes.NODE_IDENTIFIER_WITH_VALUE:
                NodeWithValue<?> nodeWithValue = (NodeWithValue<?>) pathArgument;
                writeQNameInternal(nodeWithValue.getNodeType());
                writeObject(nodeWithValue.getValue());
                break;
            case PathArgumentTypes.AUGMENTATION_IDENTIFIER:
                // No Qname in augmentation identifier
                writeAugmentationIdentifier((AugmentationIdentifier) pathArgument);
                break;
            default:
                throw new IllegalStateException("Unknown node identifier type is found : "
                        + pathArgument.getClass().toString());
        }
    }

    private void writeKeyValueMap(final Map<QName, Object> keyValueMap) throws IOException {
        if (keyValueMap != null && !keyValueMap.isEmpty()) {
            output.writeInt(keyValueMap.size());

            for (Entry<QName, Object> entry : keyValueMap.entrySet()) {
                writeQNameInternal(entry.getKey());
                writeObject(entry.getValue());
            }
        } else {
            output.writeInt(0);
        }
    }

    final void defaultWriteAugmentationIdentifier(final @NonNull AugmentationIdentifier aid) throws IOException {
        final Set<QName> qnames = aid.getPossibleChildNames();
        // Write each child's qname separately, if list is empty send count as 0
        if (!qnames.isEmpty()) {
            output.writeInt(qnames.size());
            for (QName qname : qnames) {
                writeQNameInternal(qname);
            }
        } else {
            LOG.debug("augmentation node does not have any child");
            output.writeInt(0);
        }
    }

    abstract short streamVersion();

    abstract void writeString(@NonNull String string) throws IOException;

    abstract void writeQNameInternal(@NonNull QName qname) throws IOException;

    abstract void writeAugmentationIdentifier(@NonNull AugmentationIdentifier aid) throws IOException;

    abstract void writeObject(@NonNull DataOutput output, @NonNull Object value) throws IOException;

    private void writeObject(final Object value) throws IOException {
        writeObject(output, value);
    }
}
